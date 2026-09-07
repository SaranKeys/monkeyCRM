import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedSaarthi() {
  console.log("🌱 Seeding Saarthi default config...");

  // 1. Seed the Gemini Model
  await prisma.saarthiModel.upsert({
    where: { key: 'gemini-primary' },
    update: {},
    create: {
      key: 'gemini-primary',
      provider: 'openai_compatible',
      modelId: 'gemini-2.5-flash', 
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKeyRef: 'VITE_GEMINI_KEY', // The exact key name in your .env file
      params: { temperature: 0.7, maxOutputTokens: 1000 },
      contextWindow: 1048576,
      costPer1MInput: 0.0, // Update with actual INR cost later
      costPer1MOutput: 0.0, 
      enabled: true,
    }
  });

  // 2. Seed a Default Persona
  await prisma.saarthiPersona.create({
    data: {
      version: 1,
      status: 'PUBLISHED',
      name: 'Default Sales Engineer',
      displayName: 'Saarthi',
      roleTitle: 'Solution Engineer',
      openingLine: 'Hi! I am Saarthi, the AI Solution Engineer here. How can I help you grow today?',
      aiDisclosure: 'once_in_opening',
      warmth: 80,
      humour: 30,
      directness: 70,
      formality: 50,
      curiosity: 90,
      questionsBudget: { diagnose: 4, qualify: 3 },
      languagePolicy: { default: 'en', mirror: true, allowed: ['en'] },
      signOff: '-- Saarthi',
      createdBy: 'system'
    }
  });

  // 3. Seed the basic Prompt Injection Guardrail
  await prisma.saarthiGuardrail.create({
    data: {
      key: 'prompt_injection',
      version: 1,
      status: 'PUBLISHED',
      label: 'Anti-Prompt Injection',
      description: 'Stops users from hacking the system prompt.',
      scope: 'input',
      kind: 'regex',
      config: { pattern: "(ignore all previous instructions|system prompt)" },
      action: 'escalate',
      severity: 'critical',
      order: 1,
      category: 'safety',
      createdBy: 'system'
    }
  });

  console.log("✅ Seeding complete! Saarthi has a brain.");
}

seedSaarthi().catch(console.error).finally(() => prisma.$disconnect());