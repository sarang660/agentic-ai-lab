import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";
import * as readline from "readline";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const weatherData: Record<string, { temperature: number; condition: string; humidity: number }> = {
  "new york": { temperature: 22, condition: "Sunny", humidity: 55 },
  "london": { temperature: 15, condition: "Cloudy", humidity: 72 },
  "tokyo": { temperature: 28, condition: "Humid", humidity: 80 },
  "paris": { temperature: 18, condition: "Partly Cloudy", humidity: 65 },
  "sydney": { temperature: 25, condition: "Clear", humidity: 50 },
};

function getWeather(city: string) {
  const normalizedCity = city.toLowerCase();
  const data = weatherData[normalizedCity];

  if (!data) {
    return { error: `Weather data not available for "${city}". Available cities: New York, London, Tokyo, Paris, Sydney.` };
  }

  return {
    city,
    temperature: data.temperature,
    condition: data.condition,
    humidity: data.humidity,
  };
}

const weatherTool = {
  functionDeclarations: [
    {
      name: "getWeather",
      description: "Get the current weather for a city. If no city is provided, ask the user which city they want.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          country: {
            type: Type.STRING,
            description: "The country name to get weather for",
          },
          city: {
            type: Type.STRING,
            description: "The city name to get weather for",
          },
        },
        required: ["country"],
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
  console.log('Weather Tool - Ask me about the weather! (type "exit" to quit)\n');

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
        tools: [weatherTool],
      },
    });

    const functionCall = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.functionCall
    )?.functionCall;

    if (functionCall) {
      console.log("Gemini requested:", functionCall);
      const result = getWeather(String(functionCall.args?.city));
      console.log("Gemini:", JSON.stringify(result, null, 2));
    } else {
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("Gemini:", text || "No response");
    }

    console.log();
  }
}

main().catch(console.error);
