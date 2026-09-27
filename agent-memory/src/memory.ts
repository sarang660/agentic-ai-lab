import { readFile, writeFile } from "node:fs/promises";

const MEMORY_FILE = "./memory.json";

type Memory = {
  [key: string]: string;
};

export async function loadMemory(): Promise<Memory> {
  try {
    const data = await readFile(MEMORY_FILE, "utf-8");

    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function saveMemory(
  key: string,
  value: string
): Promise<void> {
  const memory = await loadMemory();

  memory[key] = value;

  await writeFile(
    MEMORY_FILE,
    JSON.stringify(memory, null, 2)
  );
}