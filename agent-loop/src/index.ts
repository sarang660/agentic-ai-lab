import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";
import * as readline from "readline";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

function calculate(a: number, b: number, operation: string): number {
  switch (operation) {
    case "add":
      return a + b;

    case "subtract":
      return a - b;

    case "multiply":
      return a * b;

    case "divide":
      if (b === 0) {
        throw new Error("Cannot divide by zero");
      }

      return a / b;

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

const calculatorTool = {
  functionDeclarations: [
    {
      name: "calculate",
      description: "Perform a mathematical calculation between two numbers.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          a: {
            type: Type.NUMBER,
            description: "The first number",
          },
          b: {
            type: Type.NUMBER,
            description: "The second number",
          },
          operation: {
            type: Type.STRING,
            description:
              "The operation to perform: add, subtract, multiply, or divide",
          },
        },
        required: ["a", "b", "operation"],
      },
    },
  ],
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(): Promise<string> {
  return new Promise((resolve) => {
    rl.question("You: ", (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('Calculator - Ask me to calculate something! (type "exit" to quit)\n');

  const contents: any[] = [];

  while (true) {
    const userQuery = await askQuestion();

    if (userQuery.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    contents.push({
      role: "user",
      parts: [{ text: userQuery }],
    });

    // Inner loop: keep talking to Gemini until it stops requesting tool
    // calls and gives a final answer. This is the actual "agent loop".
    while (true) {
      console.log("\nCalling Gemini...");
      console.log("Conversation history:", contents);

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          tools: [calculatorTool],
        },
      });

      console.log("Gemini response:", response.candidates?.[0]?.content?.parts);

      const functionCall = response.candidates?.[0]?.content?.parts?.find(
        (part) => part.functionCall
      )?.functionCall;

      // No tool call means Gemini has produced the final answer.
      if (!functionCall) {
        console.log("\nFinal answer:");
        console.log(response.text);
        break;
      }

      console.log("\nGemini requested:");
      console.log(functionCall);

      // Add Gemini's response to the conversation history.
      contents.push(response.candidates![0]!.content!);

      // Execute the actual TypeScript function.
      let result: number;

      if (functionCall.name === "calculate") {
        result = calculate(
          Number(functionCall.args?.a),
          Number(functionCall.args?.b),
          String(functionCall.args?.operation)
        );
      } else {
        throw new Error(`Unknown tool: ${functionCall.name}`);
      }

      console.log("Tool result:", result);

      // Give the result back to Gemini and loop again.
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: functionCall.name,
              id: functionCall.id,
              response: {
                result,
              },
            },
          },
        ],
      });
    }
  }
}

main().catch(console.error);