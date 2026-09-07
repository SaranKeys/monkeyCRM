import OpenAI from "openai";

/**
 * Calculates estimated turn cost in INR
 */
export const calculateCost = (tokensIn, tokensOut, model, fxRate = 85.0) => {
  const inputCost = ((tokensIn || 0) / 1_000_000) * (model.costPer1MInput || 0);
  const outputCost = ((tokensOut || 0) / 1_000_000) * (model.costPer1MOutput || 0);
  const totalCost = inputCost + outputCost;

  // Convert USD to INR if the model rates are denominated in USD
  const totalINR = model.costCurrency === "USD" ? totalCost * fxRate : totalCost;
  return Number(totalINR.toFixed(4));
};

/**
 * Validates and retrieves the API key from environment variables
 */
const resolveApiKey = (apiKeyRef) => {
  if (!apiKeyRef) {
    throw new Error("[LLM Adapter] Model definition is missing 'apiKeyRef'.");
  }
  const apiKey = process.env[apiKeyRef];
  if (!apiKey) {
    throw new Error(`[LLM Adapter] Environment variable "${apiKeyRef}" is not set or empty.`);
  }
  return apiKey;
};

/**
 * Standard Non-Streaming Execution
 * Used for: Structured extractors, classifiers, summarizers, and guardrail judges
 */
export const executeLLMCompletion = async (
  messages,
  systemPrompt,
  modelConfig,
  isJsonMode = false,
  fxRate = 85.0
) => {
  const { provider, modelId, baseUrl, apiKeyRef, params } = modelConfig;
  const apiKey = resolveApiKey(apiKeyRef);
  const startTime = Date.now();

  try {
    if (provider === "openai_compatible" || provider === "openai" || provider === "ollama") {
      const openai = new OpenAI({
        apiKey,
        baseURL: baseUrl || undefined,
        timeout: 15000, // 15s timeout SLA per Saarthi spec
      });

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      const requestPayload = {
        model: modelId,
        messages: apiMessages,
        temperature: params?.temperature ?? 0.7,
        max_tokens: params?.maxOutputTokens ?? 1000,
      };

      if (isJsonMode && modelConfig.supportsJsonMode) {
        requestPayload.response_format = { type: "json_object" };
      }

      const response = await openai.chat.completions.create(requestPayload);

      const rawText = response.choices[0]?.message?.content || "";
      const tokensIn = response.usage?.prompt_tokens || 0;
      const tokensOut = response.usage?.completion_tokens || 0;
      const latencyMs = Date.now() - startTime;

      let parsedJson = null;
      if (isJsonMode) {
        try {
          parsedJson = JSON.parse(rawText);
        } catch {
          // Fallback regex if LLM returned markdown wrapped JSON
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedJson = JSON.parse(jsonMatch[0]);
          }
        }
      }

      return {
        text: rawText,
        json: parsedJson,
        tokensIn,
        tokensOut,
        latencyMs,
        costINR: calculateCost(tokensIn, tokensOut, modelConfig, fxRate),
        modelKey: modelConfig.key,
        provider,
        finishReason: response.choices[0]?.finish_reason || "stop",
        fallbackUsed: false,
      };
    }

    if (provider === "anthropic") {
      // Ready for direct Anthropic Messages API integration once key is added
      throw new Error("Anthropic provider is configured but waiting for Anthropic SDK initialization.");
    }

    throw new Error(`Provider "${provider}" is not recognized or supported.`);
  } catch (error) {
    console.error(`[LLM Adapter Error - ${modelConfig.key}]:`, error.message);
    throw error; // Rethrow to trigger the engine's fallbackModelKeys loop
  }
};

/**
 * Streaming Execution (SSE)
 * Used for: Live visitor chat interactions via the Next.js widget
 */
export const executeLLMStream = async (
  messages,
  systemPrompt,
  modelConfig,
  res,
  fxRate = 85.0
) => {
  const { provider, modelId, baseUrl, apiKeyRef, params } = modelConfig;
  const apiKey = resolveApiKey(apiKeyRef);
  const startTime = Date.now();

  try {
    if (provider === "openai_compatible" || provider === "openai" || provider === "ollama") {
      const openai = new OpenAI({
        apiKey,
        baseURL: baseUrl || undefined,
        timeout: 15000,
      });

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      const stream = await openai.chat.completions.create({
        model: modelId,
        messages: apiMessages,
        temperature: params?.temperature ?? 0.7,
        max_tokens: params?.maxOutputTokens ?? 1000,
        stream: true,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }
      }

      const latencyMs = Date.now() - startTime;

      // Approximate token calculation if streaming provider omits usage chunks
      const estimatedTokensIn = Math.round(JSON.stringify(apiMessages).length / 4);
      const estimatedTokensOut = Math.round(fullResponse.length / 4);

      return {
        fullResponse,
        telemetry: {
          tokensIn: estimatedTokensIn,
          tokensOut: estimatedTokensOut,
          latencyMs,
          costINR: calculateCost(estimatedTokensIn, estimatedTokensOut, modelConfig, fxRate),
          modelKey: modelConfig.key,
          provider,
          fallbackUsed: false,
        },
      };
    }

    throw new Error(`Streaming for provider "${provider}" is not implemented.`);
  } catch (error) {
    console.error(`[LLM Stream Error - ${modelConfig.key}]:`, error.message);
    throw error;
  }
};