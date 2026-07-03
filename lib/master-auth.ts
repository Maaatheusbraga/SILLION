import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const MASTER_COOKIE = "sillion_master_session";
const MASTER_JWT_SECRET = new TextEncoder().encode(
  process.env.MASTER_JWT_SECRET ??
    process.env.JWT_SECRET ??
    "sillion-master-dev-secret-change-in-production"
);

/** Usuário master — credencial via env em produção */
const MASTER_USERNAME =
  process.env.MASTER_USERNAME?.trim() || "MatheusBraga";

/** Hash bcrypt da senha master (nunca armazene senha em texto no código) */
const MASTER_PASSWORD_HASH =
  process.env.MASTER_PASSWORD_HASH ||
  "$2b$10$877n8c6eCWWZo/qVBTcKvOoYGRDcXluE86P7hccwhGude7Cqj2Zau";

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
  if (normalized !== MASTER_USERNAME) return null;

  const valid = await bcrypt.compare(password, MASTER_PASSWORD_HASH);
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
    .sign(MASTER_JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(MASTER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
    const { payload } = await jwtVerify(token, MASTER_JWT_SECRET);
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
