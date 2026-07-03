import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export function dataPath(filename: string) {
  return path.join(DATA_DIR, filename);
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  await ensureDataDir();
  const file = dataPath(filename);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile<T>(filename: string, data: T) {
  await ensureDataDir();
  const file = dataPath(filename);
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}
