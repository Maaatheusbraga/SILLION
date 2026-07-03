import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { shouldUseSecureCookies } from "@/lib/cookie-secure";
import { readMasterCredentials } from "@/lib/master-credentials";

const MASTER_COOKIE = "sillion_master_session";

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
  const creds = readMasterCredentials();
  const normalized = normalizeMasterUsername(username);
  if (normalized !== creds.username) return null;

  const valid = await bcrypt.compare(password, creds.passwordHash);
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
    sameSite: "lax",
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
