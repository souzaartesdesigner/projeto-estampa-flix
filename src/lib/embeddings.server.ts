/**
 * Geração de embeddings multimodais via Lovable AI Gateway.
 * Server-only: nunca importar em código de cliente.
 */
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/embeddings";
export const EMBEDDING_MODEL = "google/gemini-embedding-2";

type ImageInput = { url: string } | { dataUrl: string };

export async function embedImage(input: ImageInput): Promise<number[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI indisponível: chave não configurada.");

  let url: string;
  if ("dataUrl" in input) {
    url = input.dataUrl;
  } else {
    // Provedores não conseguem buscar URLs externas de forma confiável: baixamos e enviamos inline.
    const imgRes = await fetch(input.url);
    if (!imgRes.ok) throw new Error(`Falha ao baixar imagem (${imgRes.status})`);
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i += 0x8000) {
      binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    }
    const mime = imgRes.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    url = `data:${mime};base64,${btoa(binary)}`;
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: [
        {
          content: [
            { type: "text", text: "estampa / arte digital para sublimação" },
            { type: "image_url", image_url: { url } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Muitas buscas agora. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    throw new Error(`Falha ao analisar a imagem (${res.status}): ${body.slice(0, 300)}`);
  }

  const json: any = await res.json();
  const embedding = json?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error("Resposta de embedding inválida.");
  return embedding as number[];
}
