import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { readJsonFile, writeJsonFile } from "./storage";
import {
  DEFAULT_MESSAGE_TEMPLATE,
  type SessionUser,
  type User,
  type UserPublic,
  type UserSettings,
} from "./types";

const USERS_FILE = "users.json";
const COOKIE_NAME = "sillion_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sillion-dev-secret-change-in-production"
);

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    messageTemplate: user.messageTemplate || DEFAULT_MESSAGE_TEMPLATE,
    createdAt: user.createdAt,
  };
}

function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    messageTemplate: user.messageTemplate || DEFAULT_MESSAGE_TEMPLATE,
  };
}

/** Migra usuários legados (email) para username único */
function migrateLegacyUser(raw: Record<string, unknown>): User | null {
  const id = raw.id as string | undefined;
  const passwordHash = raw.passwordHash as string | undefined;
  if (!id || !passwordHash) return null;

  const username =
    (raw.username as string | undefined) ??
    (raw.email as string | undefined)?.split("@")[0] ??
    "";

  if (!username) return null;

  return {
    id,
    username: normalizeUsername(username),
    displayName:
      (raw.displayName as string | undefined) ??
      (raw.name as string | undefined) ??
      username,
    passwordHash,
    messageTemplate:
      (raw.messageTemplate as string | undefined) ?? DEFAULT_MESSAGE_TEMPLATE,
    createdAt: (raw.createdAt as string) ?? new Date().toISOString(),
  };
}

export async function getUsers(): Promise<User[]> {
  const raw = await readJsonFile<Record<string, unknown>[]>(USERS_FILE, []);
  const users = raw
    .map((entry) => migrateLegacyUser(entry))
    .filter((u): u is User => u !== null);

  const needsSave = raw.some(
    (entry) => !entry.username || entry.email !== undefined
  );
  if (needsSave && users.length > 0) {
    await saveUsers(users);
  }

  return users;
}

async function saveUsers(users: User[]) {
  await writeJsonFile(USERS_FILE, users);
}

export async function seedUsersIfEmpty() {
  const users = await getUsers();
  if (users.length > 0) return;

  const demoUsers = [
    {
      id: "user-demo-1",
      username: "ana",
      displayName: "Ana Silva",
      password: "sillion123",
    },
    {
      id: "user-demo-2",
      username: "bruno",
      displayName: "Bruno Costa",
      password: "sillion123",
    },
  ];

  const seeded: User[] = [];
  for (const u of demoUsers) {
    seeded.push({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      passwordHash: await bcrypt.hash(u.password, 10),
      messageTemplate: DEFAULT_MESSAGE_TEMPLATE,
      createdAt: new Date().toISOString(),
    });
  }

  await saveUsers(seeded);
}

export async function listUsersPublic(): Promise<UserPublic[]> {
  const users = await getUsers();
  return users.map(toUserPublic);
}

export async function createUser(input: {
  username: string;
  displayName: string;
  password: string;
}): Promise<{ user: UserPublic } | { error: string }> {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();
  const password = input.password;

  if (!username || username.length < 2) {
    return { error: "Usuário deve ter pelo menos 2 caracteres." };
  }
  if (!displayName) {
    return { error: "Nome de apresentação é obrigatório." };
  }
  if (!password || password.length < 6) {
    return { error: "Senha deve ter pelo menos 6 caracteres." };
  }

  const users = await getUsers();
  if (users.some((u) => u.username === username)) {
    return { error: "Este usuário já existe." };
  }

  const user: User = {
    id: crypto.randomUUID(),
    username,
    displayName,
    passwordHash: await bcrypt.hash(password, 10),
    messageTemplate: DEFAULT_MESSAGE_TEMPLATE,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);
  return { user: toUserPublic(user) };
}

export async function deleteUser(id: string): Promise<boolean> {
  const users = await getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  await saveUsers(users);
  return true;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.id === id);
}

export async function authenticate(
  username: string,
  password: string
): Promise<SessionUser | null> {
  const users = await getUsers();
  const normalized = normalizeUsername(username);
  const user = users.find((u) => u.username === normalized);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return toSessionUser(user);
}

export { toUserPublic };

export async function updateUserSettings(
  userId: string,
  settings: UserSettings
): Promise<SessionUser | null> {
  const users = await getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const displayName = settings.displayName.trim();
  if (!displayName) return null;

  users[index] = {
    ...users[index],
    displayName,
    messageTemplate: settings.messageTemplate.trim() || DEFAULT_MESSAGE_TEMPLATE,
  };

  await saveUsers(users);
  return toSessionUser(users[index]);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    messageTemplate: user.messageTemplate,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;

    const fresh = await getUserById(userId);
    if (fresh) return toSessionUser(fresh);

    return {
      id: userId,
      username: payload.username as string,
      displayName: payload.displayName as string,
      messageTemplate:
        (payload.messageTemplate as string) || DEFAULT_MESSAGE_TEMPLATE,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export { normalizeUsername };
