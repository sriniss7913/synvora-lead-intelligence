/**
 * Multi-Provider AI LLM Service
 * Supports OpenRouter (Free), Groq (Free 14k RPD), Google Gemini (Free 1.5k RPD),
 * Ollama (Local Unlimited), and OpenAI APIs.
 */

export const AI_PROVIDERS = {
  HEURISTIC: { id: "heuristic", name: "Built-in Heuristic Engine (100% Free - No Key)", requiresKey: false },
  OPENROUTER: { id: "openrouter", name: "OpenRouter (Free LLMs - DeepSeek/Llama 3.3)", requiresKey: true, defaultModel: "deepseek/deepseek-r1:free" },
  GROQ: { id: "groq", name: "Groq (14,400 Free RPD - Llama 3.3 70B)", requiresKey: true, defaultModel: "llama-3.3-70b-versatile" },
  GEMINI: { id: "gemini", name: "Google Gemini (1,500 Free RPD - Gemini 2.0)", requiresKey: true, defaultModel: "gemini-2.0-flash" },
  OLLAMA: { id: "ollama", name: "Ollama Local (http://localhost:11434 - Unlimited)", requiresKey: false, defaultModel: "llama3.2" },
  OPENAI: { id: "openai", name: "OpenAI (GPT-4o / o3-mini)", requiresKey: true, defaultModel: "gpt-4o-mini" }
};

export async function callAIProvider(providerId, apiKey, prompt, systemPrompt = "You are Synvora AI Lead Intelligence Engine.") {
  if (providerId === "heuristic" || !providerId) {
    throw new Error("Heuristic provider does not call external HTTP endpoints.");
  }

  try {
    if (providerId === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://synvora.com",
          "X-Title": "Synvora Lead Intelligence"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    }

    if (providerId === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    }

    if (providerId === "gemini") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }]
        })
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (providerId === "ollama") {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: `${systemPrompt}\n\n${prompt}`,
          stream: false
        })
      });
      const data = await res.json();
      return data.response || "";
    }

    if (providerId === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    }
  } catch (err) {
    console.error(`Error calling ${providerId} API:`, err);
    throw err;
  }
}
