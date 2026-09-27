import "dotenv/config";
import * as readline from "readline";
import { GoogleGenAI } from "@google/genai";
import { loadMemory, saveMemory } from "./memory.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log("\n=== Agent Memory System ===\n");

  // Ask if user wants to save new memory
  const saveMemoryResponse = await question(
    "Would you like to save any memories? (yes/no): "
  );

  if (saveMemoryResponse.toLowerCase() === "yes") {
    let addMore = true;
    while (addMore) {
      const key = await question("Enter memory key: ");
      const value = await question("Enter memory value: ");
      await saveMemory(key, value);
      console.log(`✓ Saved: ${key} = ${value}\n`);

      const continueAdding = await question(
        "Add another memory? (yes/no): "
      );
      addMore = continueAdding.toLowerCase() === "yes";
    }
  }

  const memory = await loadMemory();
  console.log("\n--- Current Memory ---");
  console.log(JSON.stringify(memory, null, 2));

  const userQuestion = await question(
    "\nEnter your question about the memory: "
  );

  console.log("\n--- Generating response ---\n");

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: `
You have access to the following user memory:

${JSON.stringify(memory, null, 2)}

User question:
${userQuestion}
    `,
  });

  console.log("Response:");
  console.log(response.text);

  rl.close();
}

main().catch(console.error);