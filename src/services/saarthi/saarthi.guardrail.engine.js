import prisma from "../../config/prisma.js";

/**
 * Runs INPUT guardrails (Visitor's message BEFORE it hits the LLM)
 */
export const runInputGuardrails = async (visitorText) => {
    // 1. Fetch all active, published input guardrails
    const guardrails = await prisma.saarthiGuardrail.findMany({
        where: { 
            status: 'PUBLISHED', 
            enabled: true,
            scope: { in: ['input', 'both'] } 
        },
        orderBy: { order: 'asc' }
    });

    const hits = [];

    // 2. Test the text against the rules
    for (const rule of guardrails) {
        let isHit = false;

        // Handle Regex Rules (e.g., matching "ignore instructions")
        if (rule.kind === 'regex' && rule.config?.pattern) {
            try {
                const regex = new RegExp(rule.config.pattern, 'i');
                if (regex.test(visitorText)) isHit = true;
            } catch (e) {
                console.error(`[Guardrail] Invalid regex in rule ${rule.key}`);
            }
        }
        
        // Handle Keyword List Rules (e.g., competitor names, profanity)
        if (rule.kind === 'keyword' && Array.isArray(rule.config?.keywords)) {
            const lowerText = visitorText.toLowerCase();
            isHit = rule.config.keywords.some(kw => lowerText.includes(kw.toLowerCase()));
        }

        // If a rule was broken, log the hit!
        if (isHit) {
            hits.push({
                guardrailKey: rule.key,
                version: rule.version,
                scope: 'input',
                action: rule.action,
                severity: rule.severity,
                at: new Date()
            });

            // If it's a hard block or escalate, we stop checking other rules to save time
            if (rule.stopOnHit !== false) break; 
        }
    }

    // 3. Decide if we need to block the LLM call entirely
    const shouldBlock = hits.some(h => ['escalate', 'block_replace'].includes(h.action));
    const isEscalation = hits.some(h => h.action === 'escalate');

    return { hits, shouldBlock, isEscalation };
};