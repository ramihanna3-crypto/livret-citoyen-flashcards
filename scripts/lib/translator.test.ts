import { describe, it, expect, vi } from "vitest";
import { translateChunk } from "./translator";

describe("translateChunk", () => {
  it("requests structured JSON from the model and returns ar_q + ar_a + fr_q (when not verbatim)", async () => {
    const messages = vi.fn().mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "emit_card",
          input: {
            fr_q: "Quelle est la devise de la République ?",
            ar_q: "ما هو شعار الجمهورية؟",
            ar_a: "تكفل الجمهورية الحرية والمساواة والإخاء.",
          },
        },
      ],
    });
    const fakeClient = { messages: { create: messages } };

    const out = await translateChunk(
      // @ts-expect-error -- duck-typed test client
      fakeClient,
      "claude-sonnet-4-6",
      {
        chunk_id: "valeurs-raw-001",
        theme: "valeurs",
        source: "livret",
        page: 4,
        fr_a: "La République garantit la liberté, l'égalité et la fraternité.",
      },
    );

    expect(messages).toHaveBeenCalledOnce();
    expect(out).toEqual({
      fr_q: "Quelle est la devise de la République ?",
      ar_q: "ما هو شعار الجمهورية؟",
      ar_a: "تكفل الجمهورية الحرية والمساواة والإخاء.",
    });
  });

  it("preserves the verbatim French question when the chunk is a Ministry Q&A box", async () => {
    const messages = vi.fn().mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "emit_card",
          input: {
            ar_q: "هل يحق لك قول كل شيء؟",
            ar_a: "نعم، حرية التعبير حق أساسي.",
          },
        },
      ],
    });
    const fakeClient = { messages: { create: messages } };

    const out = await translateChunk(
      // @ts-expect-error -- duck-typed test client
      fakeClient,
      "claude-sonnet-4-6",
      {
        chunk_id: "valeurs-raw-001",
        theme: "valeurs",
        source: "livret",
        page: 4,
        fr_a: "Oui, la liberté d'expression est un droit fondamental.",
        fr_q: "Avez-vous le droit de tout dire publiquement ?",
        verbatim_question: true,
      },
    );

    expect(out.fr_q).toBe("Avez-vous le droit de tout dire publiquement ?");
    expect(out.ar_q).toBe("هل يحق لك قول كل شيء؟");

    const callArgs = messages.mock.calls[0][0];
    expect(JSON.stringify(callArgs)).toMatch(/verbatim/i);
  });

  it("throws if the model returns no tool_use block", async () => {
    const fakeClient = {
      messages: {
        create: vi.fn().mockResolvedValue({ content: [{ type: "text", text: "..." }] }),
      },
    };
    await expect(
      translateChunk(
        // @ts-expect-error -- duck-typed test client
        fakeClient,
        "claude-sonnet-4-6",
        {
          chunk_id: "x",
          theme: "valeurs",
          source: "livret",
          page: 4,
          fr_a: "ok",
        },
      ),
    ).rejects.toThrow(/no tool_use/i);
  });
});
