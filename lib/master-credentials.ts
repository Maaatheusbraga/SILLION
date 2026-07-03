import { readFileSync, existsSync } from "fs";
import path from "path";

export interface MasterCredentials {
  username: string;
  passwordHash: string;
}

const DEFAULT: MasterCredentials = {
  username: "MatheusBraga",
  passwordHash:
    "$2b$10$877n8c6eCWWZo/qVBTcKvOoYGRDcXluE86P7hccwhGude7Cqj2Zau",
};

const CREDENTIALS_FILE = path.join(process.cwd(), "data", "master-auth.json");

function normalizeEnvValue(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function fromEnv(): MasterCredentials | null {
  const username = process.env["MASTER_USERNAME"]?.trim();
  const hashRaw = process.env["MASTER_PASSWORD_HASH"]?.trim();
  if (!username || !hashRaw) return null;

  const passwordHash = normalizeEnvValue(hashRaw);
  if (!passwordHash.startsWith("$2") || passwordHash.length < 59) return null;

  return { username: normalizeEnvValue(username), passwordHash };
}

/** Lê credenciais em runtime — arquivo JSON evita dotenv/build do Next.js. */
export function readMasterCredentials(): MasterCredentials {
  if (existsSync(CREDENTIALS_FILE)) {
    try {
      const raw = JSON.parse(readFileSync(CREDENTIALS_FILE, "utf-8")) as {
        username?: string;
        passwordHash?: string;
      };
      const username = raw.username?.trim();
      const passwordHash = raw.passwordHash?.trim();
      if (
        username &&
        passwordHash?.startsWith("$2") &&
        passwordHash.length >= 59
      ) {
        return { username, passwordHash };
      }
    } catch {
      /* fallback abaixo */
    }
  }

  return fromEnv() ?? DEFAULT;
}

export function masterCredentialsPath() {
  return CREDENTIALS_FILE;
}
