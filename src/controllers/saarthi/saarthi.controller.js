import prisma from "../../config/prisma.js";
import { executeLLMStream } from "../../adapter/saarthi.llm.adapter.js"; 
import { v4 as uuidv4 } from "uuid";
import { buildSystemPrompt } from "../../services/saarthi/saarthi.prompt.assembler.js";
import { runInputGuardrails } from "../../services/saarthi/saarthi.guardrail.engine.js";

export const createSession = async (req, res) => {
    try {
        const persona = await prisma.saarthiPersona.findFirst({
            where: { status: "PUBLISHED" }
        });

        const sessionId = uuidv4();
        const conversation = await prisma.saarthiConversation.create({
            data: {
                sessionId: sessionId,
                stage: "GATE",  
                visitor: {
                    ipHash: req.ip || "unknown",
                    userAgent: req.headers['user-agent'] || "unknown",
                    whatsappOptIn: false
                },
                configSnapshot: {
                    personaV: persona?.version || 1
                },
                telemetry: {},
                flags: { reviewed: false, isTestSandbox: false }
            }
        });

        return res.status(200).json({
            status: "success",
            data: {
                sessionId: conversation.sessionId,
                openingLine: persona?.openingLine || "Hi! I am Saarthi. How can I help you?",
            }
        });
    } catch (error) {
        console.error("[Saarthi Session Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to start session" });
    }
};

export const submitGate = async (req, res) => {
    try {
        const { id } = req.params; // This is the sessionId
        const { firstName, email, phoneE164, company, whatsappOptIn } = req.body;

        // 🟢 1. Create the new Sales Lead in your CRM database
        const newLead = await prisma.lead.create({
            data: {
                firstName,
                email,
                phoneE164,
                company,
                status: "TALKING_TO_SAARTHI", // FSM Status from your spec
                saarthi: {
                    status: "TALKING_TO_SAARTHI",
                    conversationId: id // Link back to the chat session
                }
            }
        });

        // 🟢 2. Update the Chat Session and link the Lead ID
        await prisma.saarthiConversation.update({
            where: { sessionId: id },
            data: {
                stage: "DIAGNOSE", // Move the FSM forward
                leadId: newLead.id, // Connect the chat to the newly created Lead record
                visitor: {
                    firstName,
                    email,
                    phoneE164,
                    company,
                    ipHash: req.ip || "unknown",
                    userAgent: req.headers['user-agent'] || "unknown",
                    whatsappOptIn: whatsappOptIn || false
                }
            }
        });

        return res.status(200).json({ 
            status: "success", 
            message: "Gate passed, Lead created, moved to DIAGNOSE." 
        });
    } catch (error) {
        console.error("[Saarthi Gate Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to process gate" });
    }
};


export const streamMessage = async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        const { id } = req.params; 
        const { text } = req.body;

        // 🟢 1. RUN INPUT GUARDRAILS (The Bouncer Pre-Check)
        const guardrailCheck = await runInputGuardrails(text);
        
        if (guardrailCheck.shouldBlock) {
            console.log(`🚨 [Guardrail Hit]: Blocked malicious message in session ${id}`);
            
            // If the rule says 'escalate' (like a prompt injection), hand off to a human
            if (guardrailCheck.isEscalation) {
                await prisma.saarthiConversation.update({
                    where: { sessionId: id },
                    data: { 
                        escalated: true,
                        escalationReason: "Security/Guardrail Triggered",
                        stage: "ENDED" // Stop the AI from talking anymore
                    }
                });
            }

            // Stream a safe, canned rejection message back to the frontend
            res.write(`data: ${JSON.stringify({ text: "I'm sorry, but I cannot process that request. A human team member has been notified and will reach out shortly." })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            
            // 🛑 RETURN EARLY! Do not call Gemini!
            return res.end(); 
        }

        // 🟢 2. Fetch context (Only happens if the user passed the guardrails)
        const conversation = await prisma.saarthiConversation.findUnique({ where: { sessionId: id } });
        const modelConfig = await prisma.saarthiModel.findUnique({ where: { key: "gemini-primary" } });
        const persona = await prisma.saarthiPersona.findFirst({ where: { status: "PUBLISHED" } });

        if (!conversation) throw new Error("Session not found");

        if (conversation.takenOverByUserId || conversation.escalated) {
            console.log(`[Takeover] Human is handling session ${id}. Bypassing AI.`);
            
            const visitorTurn = {
                id: uuidv4(),
                at: new Date(),
                channel: "web",
                role: "visitor",
                text: text,
                stageAtTurn: "ENDED",
                guardrailHits: []
            };

            await prisma.saarthiConversation.update({
                where: { sessionId: id },
                data: { turns: { push: [visitorTurn] } }
            });

            const io = req.app.get('io');
            io.to(id).emit('receive_saarthi_message', visitorTurn);

            res.write(`data: [DONE]\n\n`);
            return res.end();
        }


        const visitorTurn = {
            id: uuidv4(),
            at: new Date(),
            channel: "web",
            role: "visitor",
            text: text,
            stageAtTurn: conversation.stage,
            guardrailHits: guardrailCheck.hits // 🟢 Log any non-blocking hits for auditing!
        };

        // 🟢 3. Build prompt and execute LLM
        const systemPrompt = buildSystemPrompt(persona, conversation, conversation.visitor);

        const history = conversation.turns.map(turn => ({
            role: turn.role === "visitor" ? "user" : "assistant",
            content: turn.text 
        }));

        const messages = [
            ...history, 
            { role: "user", content: text }
        ];

        const { fullResponse, telemetry } = await executeLLMStream(messages, systemPrompt, modelConfig, res);

        // 🟢 4. Parse the FSM JSON
        let extraction = {};
        const extractMatch = fullResponse.match(/<extract>(.*?)<\/extract>/s);
        
        const visibleText = fullResponse.replace(/<extract>.*?<\/extract>/s, "").trim();

        if (extractMatch) {
            try { extraction = JSON.parse(extractMatch[1]); } catch(e) { console.error("JSON parse failed"); }
        }

        let nextStage = conversation.stage;
        
        if (conversation.stage === "DIAGNOSE" && extraction.painConfirmed) {
            nextStage = "REFRAME";
        }

        const aiTurn = {
            id: uuidv4(),
            at: new Date(),
            channel: "web",
            role: "saarthi",
            text: visibleText,
            stageAtTurn: nextStage,
            extraction: extraction,
            llm: {
                ...telemetry,
                promptVersion: 1
            },
            guardrailHits: []
        };

        // 🟢 5. Save everything back to MongoDB
        await prisma.saarthiConversation.update({
            where: { sessionId: id },
            data: {
                stage: nextStage,
                turns: { push: [visitorTurn, aiTurn] }, 
                telemetry: {
                    update: {
                        tokensIn: { increment: telemetry.tokensIn },
                        tokensOut: { increment: telemetry.tokensOut },
                        llmCalls: { increment: 1 }
                    }
                }
            }
        });

        res.write(`data: [DONE]\n\n`);
        res.end();

    } catch (error) {
        console.error("[Saarthi Stream Error]:", error);
        res.write(`data: ${JSON.stringify({ text: "Something went wrong" })}\n\n`);
        res.end();
    }
};