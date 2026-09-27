# gemini-tool-calling

The smallest possible Gemini tool calling demo — shows how to define a tool, give it to Gemini, and execute it when the model asks for it.

This isn't about the calculator or weather. It's about the mechanism: define a function schema → pass it in `tools` → check for `functionCall` in the response → run the real function → show the result. That single request → tool → result pattern is the core of tool calling (without the loop).

## What it does

- Chat with it in the terminal.
- `src/index.ts` — `calculate` tool (`add`/`subtract`/`multiply`/`divide`). Ask `what's 47 times 12?` and Gemini requests `calculate({a: 47, b: 12, operation: "multiply"})`.
- `src/weather-tool.ts` — `getWeather` tool with mock data for New York, London, Tokyo, Paris, Sydney. Ask `what's the weather in Tokyo?` and Gemini requests `getWeather({city: "Tokyo"})`.

No loop — it runs the tool once and prints the result directly.

## Setup

```bash
npm install
cp .env.example .env
```

Then open `.env` and add your Gemini API key (get one at https://aistudio.google.com/app/apikey):

```
GEMINI_API_KEY=your-key-here
```

## Run it

```bash
npx tsx src/index.ts
# or
npx tsx src/weather-tool.ts
```

Type a question, or `exit` to quit. The console prints what Gemini requested (`Gemini requested: { functionCall }`) and the tool result.

## Files

- `src/index.ts` — calculator tool definition (`calculatorTool`), Gemini call with `config: { tools }`, and `functionCall` handling.
- `src/weather-tool.ts` — weather tool definition (`weatherTool`), mock `weatherData`, and same tool-calling flow for city weather.
