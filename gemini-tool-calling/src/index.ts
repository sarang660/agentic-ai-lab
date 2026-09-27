import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";
import * as readline from "readline";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function calculate(a: number, b: number, operation: string) {
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
  console.log('Calculator Tool - Ask me to calculate something! (type "exit" to quit)\n');

  while (true) {
    const userQuery = await askQuestion();

    if (userQuery.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userQuery,
      config: {
        tools: [calculatorTool],
      },
    });

    const functionCall = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.functionCall
    )?.functionCall;

    if (functionCall) {
      console.log("Gemini requested:", functionCall);
      const result = calculate(
        Number(functionCall.args?.a),
        Number(functionCall.args?.b),
        String(functionCall.args?.operation)
      );
      console.log("Gemini:", result);
    } else {
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("Gemini:", text || "No response");
    }

    console.log();
  }
}

main().catch(console.error);