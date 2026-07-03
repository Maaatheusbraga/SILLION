import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { shouldUseSecureCookies } from "@/lib/cookie-secure";

const MASTER_COOKIE = "sillion_master_session";

const DEFAULT_MASTER_USERNAME = "MatheusBraga";
const DEFAULT_MASTER_PASSWORD_HASH =
  "$2b$10$877n8c6eCWWZo/qVBTcKvOoYGRDcXluE86P7hccwhGude7Cqj2Zau";

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

/** Lê env em runtime — evita que o Next.js congele credenciais no `next build`. */
function getMasterUsername() {
  const fromEnv = process.env["MASTER_USERNAME"]?.trim();
  return fromEnv ? normalizeEnvValue(fromEnv) : DEFAULT_MASTER_USERNAME;
}

function getMasterPasswordHash() {
  const raw = process.env["MASTER_PASSWORD_HASH"]?.trim();
  const fromEnv = raw ? normalizeEnvValue(raw) : "";
  if (fromEnv) {
    if (!fromEnv.startsWith("$2") || fromEnv.length < 59) {
      console.error(
        "[master-auth] MASTER_PASSWORD_HASH inválido ou truncado — verifique .env.local (sobrescreve .env.production) ou rode: npm run master:set -- SUA_SENHA"
      );
    }
    return fromEnv;
  }
  return DEFAULT_MASTER_PASSWORD_HASH;
}

function getMasterJwtSecret() {
  const secret =
    process.env["MASTER_JWT_SECRET"]?.trim() ||
    process.env["JWT_SECRET"]?.trim() ||
    "sillion-master-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export interface MasterSession {
  username: string;
  role: "master";
}

function normalizeMasterUsername(value: string) {
  return value.trim();
}

export async function authenticateMaster(
  username: string,
  password: string
): Promise<MasterSession | null> {
  const normalized = normalizeMasterUsername(username);
  if (normalized !== getMasterUsername()) return null;

  const valid = await bcrypt.compare(password, getMasterPasswordHash());
  if (!valid) return null;

  return { username: normalized, role: "master" };
}

export async function createMasterSession(session: MasterSession) {
  const token = await new SignJWT({
    username: session.username,
    role: "master",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getMasterJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(MASTER_COOKIE, token, {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function destroyMasterSession() {
  const cookieStore = await cookies();
  cookieStore.delete(MASTER_COOKIE);
}

export async function getMasterSession(): Promise<MasterSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MASTER_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getMasterJwtSecret());
    if (payload.role !== "master") return null;
    return {
      username: payload.username as string,
      role: "master",
    };
  } catch {
    return null;
  }
}

export async function requireMasterSession(): Promise<MasterSession> {
  const session = await getMasterSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
