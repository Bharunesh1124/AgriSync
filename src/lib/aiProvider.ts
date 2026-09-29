/**
 * Robust AI Provider Utility with Multi-Key Pool Rotation & Auto-Fallback
 * Supports Gemini Key Failover + Groq Backup + Local Fallback
 */

let remoteGeminiKeys: string[] = [];

/**
 * Register dynamic API keys fetched from Supabase / Remote Config
 */
export function registerRemoteGeminiKeys(keys: string[]) {
  if (Array.isArray(keys)) {
    remoteGeminiKeys = keys.filter(Boolean);
  }
}

/**
 * Returns the pool of active Gemini API keys
 */
export function getGeminiKeysPool(): string[] {
  const pool: string[] = [];

  const key1 = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const key2 = process.env.EXPO_PUBLIC_GEMINI_API_KEY_2;

  if (key1) pool.push(key1);
  if (key2 && !pool.includes(key2)) pool.push(key2);

  for (const rk of remoteGeminiKeys) {
    if (rk && !pool.includes(rk)) pool.push(rk);
  }

  return pool;
}

export async function callAiJson<T>(
  prompt: string,
  fallbackData: T,
  isArray: boolean = false,
): Promise<T> {
  const keysPool = getGeminiKeysPool();
  const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-3.6-flash", // Legacy mock
    "gemini-flash-latest",
  ];

  // 1. Try Gemini API Key Pool with Auto-Rotation & Model Failover
  for (const key of keysPool) {
    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0,
              },
            }),
          },
        );

        const data = await res.json();
        if (!data.error && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          const rawText = data.candidates[0].content.parts[0].text;
          const parsed = parseJsonFromText(rawText, isArray);
          if (parsed) return parsed as T;
        } else {
          console.warn(
            `[AI Key Pool] Key/Model ${model} returned:`,
            data.error?.message || data,
          );
        }
      } catch (e) {
        console.warn(`[AI Key Pool] Key failover on ${model}...`, e);
      }
    }
  }

  // 2. Try Groq API Fallback
  if (groqKey) {
    try {
      const res = await fetch(
        `https://api.groq.com/openai/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0,
          }),
        },
      );

      const data = await res.json();
      if (!data.error && data.choices?.[0]?.message?.content) {
        const rawText = data.choices[0].message.content;
        const parsed = parseJsonFromText(rawText, isArray);
        if (parsed) return parsed as T;
      }
    } catch (e) {
      console.warn("Groq API fallback failed...", e);
    }
  }

  // 3. Guaranteed Local Fallback
  console.log("Using guaranteed local fallback data.");
  return fallbackData;
}

export async function callAiVisionJson<T>(
  prompt: string,
  base64Image: string,
  mimeType: string,
  fallbackData: T,
): Promise<T> {
  const keysPool = getGeminiKeysPool();
  const cleanBase64 = base64Image
    .replace(/^data:image\/\w+;base64,/, "")
    .trim();
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro-vision",
    "gemini-3.6-flash"
  ];

  for (const key of keysPool) {
    let keyRateLimited = false;
    for (const model of models) {
      if (keyRateLimited) break;
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: mimeType || "image/jpeg",
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0,
              },
            }),
          },
        );

        const data = await res.json();
        if (res.status === 429) {
          console.warn(
            `[AI Vision] Key ${key.substring(0, 10)}... rate limited (429). Rotating key...`,
          );
          keyRateLimited = true;
          break;
        }

        if (
          res.status === 200 &&
          data.candidates?.[0]?.content?.parts?.[0]?.text
        ) {
          const rawText = data.candidates[0].content.parts[0].text;
          const parsed = parseJsonFromText(rawText, false);
          if (parsed) return parsed as T;
        } else {
          console.warn(
            `[AI Vision] Model ${model} returned ${res.status}:`,
            data.error?.message || data,
          );
        }
      } catch (e) {
        console.warn(`[AI Vision] Call failed for ${model}...`, e);
      }
    }
  }

  return fallbackData;
}

function parseJsonFromText(text: string, isArray: boolean) {
  if (!text) return null;
  try {
    let clean = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const startChar = isArray ? "[" : "{";
    const endChar = isArray ? "]" : "}";

    const startIdx = clean.indexOf(startChar);
    if (startIdx === -1) return null;

    // Balance braces/brackets to extract only the valid JSON substring
    let openCount = 0;
    let endIdx = -1;
    let inString = false;
    let escape = false;

    for (let i = startIdx; i < clean.length; i++) {
      const char = clean[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === startChar) {
          openCount++;
        } else if (char === endChar) {
          openCount--;
          if (openCount === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }

    if (endIdx !== -1) {
      clean = clean.substring(startIdx, endIdx + 1);
    } else {
      const fallbackEndIdx = clean.lastIndexOf(endChar);
      if (fallbackEndIdx > startIdx) {
        clean = clean.substring(startIdx, fallbackEndIdx + 1);
      }
    }

    // Sanitize unescaped control chars inside JSON strings
    clean = clean.replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
      if (match === "\n") return "\\n";
      if (match === "\r") return "\\r";
      if (match === "\t") return "\\t";
      return "";
    });

    return JSON.parse(clean);
  } catch (err) {
    console.warn("[parseJsonFromText] Handled JSON parse error:", err);
    return null;
  }
}
