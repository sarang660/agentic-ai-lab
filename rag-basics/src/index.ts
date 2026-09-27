import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { readFile } from "node:fs/promises";
import { pool, query } from "./db";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const DOCUMENT_PATH = "./documents/company-policy.txt";

// --------------------------------------------------
// 1. Split document into chunks
// --------------------------------------------------

function chunkText(text: string, chunkSize: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  return chunks;
}

// --------------------------------------------------
// 2. Generate an embedding
// --------------------------------------------------

async function createEmbedding(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding) {
    throw new Error("No embedding returned");
  }

  return embedding;
}

// --------------------------------------------------
// 3. pgvector helpers
// --------------------------------------------------

// pgvector expects the array as a string like "[0.1,0.2,0.3]"
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function storeChunk(
  source: string,
  content: string,
  embedding: number[]
): Promise<void> {
  await query(
    `INSERT INTO document_chunks (source, content, embedding)
     VALUES ($1, $2, $3::vector)`,
    [source, content, toVectorLiteral(embedding)]
  );
}

async function findSimilarChunks(
  embedding: number[],
  limit: number
): Promise<{ content: string; distance: number }[]> {
  return query(
    `SELECT content, embedding <=> $1::vector AS distance
     FROM document_chunks
     ORDER BY distance ASC
     LIMIT $2`,
    [toVectorLiteral(embedding), limit]
  );
}

// --------------------------------------------------
// 4. Main
// --------------------------------------------------

async function main() {
  // ------------------------------------------------
  // Read document
  // ------------------------------------------------

  const document = await readFile(DOCUMENT_PATH, "utf-8");

  // ------------------------------------------------
  // Create chunks
  // ------------------------------------------------

  const chunks = chunkText(document, 20);

  console.log(`Created ${chunks.length} chunks`);

  // ------------------------------------------------
  // Clear out any previous run's chunks for this
  // document, so re-running the script stays idempotent
  // ------------------------------------------------

  await query(`DELETE FROM document_chunks WHERE source = $1`, [
    DOCUMENT_PATH,
  ]);

  // ------------------------------------------------
  // Create + store an embedding for every chunk
  // ------------------------------------------------

  for (const [index, chunk] of chunks.entries()) {
    console.log(`Creating embedding for chunk ${index + 1}...`);

    const embedding = await createEmbedding(chunk);

    await storeChunk(DOCUMENT_PATH, chunk, embedding);
  }

  console.log("\nAll chunk embeddings created and stored in Postgres.");

  // ------------------------------------------------
  // User's question
  // ------------------------------------------------

  const query_ =
    "How long does an enterprise customer have to request a refund?";

  console.log(`\nQuery: ${query_}`);

  // ------------------------------------------------
  // Create embedding for the question
  // ------------------------------------------------

  const queryEmbedding = await createEmbedding(query_);

  // ------------------------------------------------
  // Ask Postgres/pgvector for the closest chunks
  // ------------------------------------------------

  const results = await findSimilarChunks(queryEmbedding, 5);

  // ------------------------------------------------
  // Display similarity results
  // ------------------------------------------------

  console.log("\nSimilarity results:\n");

  results.forEach((result, index) => {
    const similarity = 1 - result.distance; // <=> returns cosine distance
    console.log(`--- Result ${index + 1} ---`);
    console.log(`Similarity: ${similarity.toFixed(4)}`);
    console.log(`Text: ${result.content}\n`);
  });

  // ------------------------------------------------
  // Get the most relevant chunk
  // ------------------------------------------------

  const bestMatch = results[0];

  console.log("=================================");
  console.log("Most relevant chunk:");
  console.log(bestMatch.content);
  console.log(`Similarity: ${(1 - bestMatch.distance).toFixed(4)}`);
  console.log("=================================");

  // ------------------------------------------------
  // Generate final answer using retrieved context
  // ------------------------------------------------

  const prompt = `
You are a helpful assistant answering questions about company policy.

Use the context below to answer the user's question.

Context:
${bestMatch.content}

Question:
${query_}

Answer the question using only the provided context.

If the context does not contain enough information to answer,
say that you don't have enough information.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  // ------------------------------------------------
  // Final answer
  // ------------------------------------------------

  console.log("\nFinal answer:");
  console.log(response.text);
}

main()
  .catch(console.error)
  .finally(() => pool.end());
