import prisma from "../../config/prisma.js";
import { v4 as uuidv4 } from "uuid";

export const getConversations = async (req, res) => {
    try {
        const conversations = await prisma.saarthiConversation.findMany({
            where: {
                stage: { not: "GATE" } 
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                sessionId: true,
                stage: true,
                visitor: true, 
                telemetry: { select: { costINR: true, llmCalls: true } },
                createdAt: true,
                leadId: true,
                flags: true,
                escalated: true,
                takenOverByUserId: true 
            }
        });

        return res.status(200).json({ status: "success", data: conversations });
    } catch (error) {
        console.error("[Saarthi Admin Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to fetch conversations" });
    }
};

export const getConversationDetail = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const conversation = await prisma.saarthiConversation.findUnique({
            where: { sessionId }
        });

        if (!conversation) {
            return res.status(404).json({ status: "fail", message: "Conversation not found" });
        }

        return res.status(200).json({ status: "success", data: conversation });
    } catch (error) {
        console.error("[Saarthi Admin Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to fetch transcript" });
    }
};

export const takeOverConversation = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const currentUser = req.user?.id || "000000000000000000000000"; 

        const conversation = await prisma.saarthiConversation.update({
            where: { sessionId },
            data: {
                escalated: true,
                escalationReason: "Manual Admin Takeover",
                takenOverByUserId: currentUser,
                takenOverAt: new Date(),
                stage: "ENDED" 
            }
        });

        return res.status(200).json({ status: "success", message: "You have control. AI is locked out.", data: conversation });
    } catch (error) {
        console.error("[Take Over Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to take over conversation" });
    }
};

export const sendAdminMessage = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { text } = req.body;

        const humanTurn = {
            id: uuidv4(),
            at: new Date(),
            channel: "admin",
            role: "human_agent",
            text: text,
            stageAtTurn: "ENDED"
        };

        await prisma.saarthiConversation.update({
            where: { sessionId },
            data: { turns: { push: [humanTurn] } }
        });

        const io = req.app.get('io');
        io.to(sessionId).emit('receive_saarthi_message', humanTurn);

        return res.status(200).json({ status: "success", message: "Message sent to visitor.", data: humanTurn });
    } catch (error) {
        console.error("[Send Admin Message Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to send message" });
    }
};

export const purgeConversation = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const currentUser = req.user?.id || "000000000000000000000000"; 

        await prisma.$transaction(async (tx) => {
            const convo = await tx.saarthiConversation.findUnique({ where: { sessionId } });
            
            if (!convo) throw new Error("Conversation not found");

            // 1. Delete the conversation
            await tx.saarthiConversation.delete({
                where: { sessionId }
            });

            // 2. Write the permanent Audit Log for compliance
            await tx.saarthiAuditLog.create({
                data: {
                    action: "PURGE",
                    entity: "CONVERSATION",
                    // 🟢 THE FIX: Use convo.id (MongoDB ObjectId) instead of sessionId (UUID)
                    entityId: convo.id, 
                    userId: currentUser,
                    diff: "Completely wiped visitor data and transcript for GDPR compliance."
                }
            });
        });

        return res.status(200).json({ status: "success", message: "Visitor data has been permanently nuked." });
    } catch (error) {
        console.error("[Purge Error]:", error);
        return res.status(500).json({ status: "fail", message: "Failed to purge conversation" });
    }
};