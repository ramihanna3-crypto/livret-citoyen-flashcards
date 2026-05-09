import type Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import type { Chunk } from "../extract-source.ts";

export type Drafted = { fr_q: string; ar_q: string; ar_a: string };

const SYSTEM_VERBATIM = `You are translating French civic-education content for Arabic-speaking applicants for French citizenship.

Translate the provided French question and French answer into Modern Standard Arabic (الفصحى).

Rules:
- Do NOT abridge. Translate the full content.
- Do NOT interpret or simplify. Translate.
- Preserve French legal/historical terms in parentheses on first mention if helpful (e.g., "العلمانية (laïcité)").
- Use respectful, neutral register suitable for an official document.
- The French question is already authoritative — translate it; do NOT rewrite it in French.

Emit your output via the emit_card tool.`;

const SYSTEM_NEW = `You are turning French civic-education paragraphs into bilingual flashcards for Arabic-speaking applicants for French citizenship.

For the provided French paragraph (which is the verbatim ANSWER), produce:
1. A short French question (fr_q) that elicits this exact paragraph as its answer. The question should be specific, factual, and 5–25 words.
2. The Arabic translation of the question (ar_q).
3. The Arabic translation of the paragraph (ar_a).

Rules:
- The French answer text is fixed and verbatim from the Ministère de l'Intérieur — do NOT modify it; only generate fr_q.
- Use Modern Standard Arabic (الفصحى) for ar_q and ar_a.
- Do NOT abridge or interpret. Translate, don't paraphrase.
- Preserve French legal/historical terms in parentheses on first mention if useful.
- Use respectful, neutral register.

Emit your output via the emit_card tool.`;

const TOOL_EMIT_VERBATIM: Tool = {
  name: "emit_card",
  description: "Emit the Arabic translation of an existing verbatim French question and answer.",
  input_schema: {
    type: "object",
    properties: {
      ar_q: { type: "string", description: "The Arabic translation of the French question." },
      ar_a: { type: "string", description: "The Arabic translation of the French answer." },
    },
    required: ["ar_q", "ar_a"],
  },
};

const TOOL_EMIT_NEW: Tool = {
  name: "emit_card",
  description: "Emit a French question and Arabic translations for a verbatim French answer.",
  input_schema: {
    type: "object",
    properties: {
      fr_q: {
        type: "string",
        description: "Short French question that elicits the verbatim answer.",
      },
      ar_q: { type: "string", description: "Arabic translation of fr_q." },
      ar_a: { type: "string", description: "Arabic translation of the French answer." },
    },
    required: ["fr_q", "ar_q", "ar_a"],
  },
};

type AnyClient = Pick<Anthropic, "messages">;

export async function translateChunk(
  client: AnyClient,
  model: string,
  chunk: Chunk,
): Promise<Drafted> {
  const verbatim = chunk.verbatim_question === true && chunk.fr_q;
  const system = verbatim ? SYSTEM_VERBATIM : SYSTEM_NEW;
  const tool = verbatim ? TOOL_EMIT_VERBATIM : TOOL_EMIT_NEW;

  const userMsg = verbatim
    ? `French question (verbatim, do not change): ${chunk.fr_q}\n\nFrench answer (verbatim, do not change): ${chunk.fr_a}\n\nProduce ar_q and ar_a.`
    : `French answer (verbatim, do not change): ${chunk.fr_a}\n\nProduce fr_q (short, specific, 5-25 words), ar_q, ar_a.`;

  const resp = await client.messages.create({
    model,
    max_tokens: 1024,
    system,
    tools: [tool],
    tool_choice: { type: "tool", name: "emit_card" },
    messages: [{ role: "user", content: userMsg }],
  });

  const toolUse = resp.content.find((b: { type: string }) => b.type === "tool_use") as
    | { type: "tool_use"; input: Record<string, string> }
    | undefined;
  if (!toolUse) throw new Error("Model returned no tool_use block");

  const out = toolUse.input;
  if (verbatim) {
    return { fr_q: chunk.fr_q!, ar_q: out.ar_q, ar_a: out.ar_a };
  }
  if (!out.fr_q) throw new Error("Model did not produce fr_q for non-verbatim chunk");
  return { fr_q: out.fr_q, ar_q: out.ar_q, ar_a: out.ar_a };
}
