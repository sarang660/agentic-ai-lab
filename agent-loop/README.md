# agent-loop

The smallest possible "agent loop" I could build — a calculator bot that talks to Gemini, asks for a tool call whenever it needs to do math, and loops until it has a final answer.

This isn't about the calculator. It's about the loop: ask the model → check if it wants a tool → run the tool for real → hand the result back → repeat until it gives a normal answer. That loop is the core pattern behind agentic AI.

## What it does

- Chat with it in the terminal.
- Ask it something like `what's 47 times 12?`
- The model doesn't calculate it itself — it asks the code to run a `calculate` tool, gets the result back, and replies with the final answer.

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
npm start
```

Type a math question, or `exit` to quit. The console also prints the full conversation history and each tool call, so you can see the loop happening step by step.

## Files

- `src/index.ts` — everything lives here: the `calculate` tool, its description for the model, and the agent loop itself.
