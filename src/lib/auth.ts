import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { UserSession } from "./types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "jobdesk_super_secret_jwt_key_2026_change_in_production"
);
const COOKIE_NAME = "jobdesk_session";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: UserSession): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: UserSession) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      const session = await verifySessionToken(token);
      if (session) {
        // Safe check for valid 24-character hex MongoDB ObjectId
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(session.id);

        if (isValidObjectId) {
          const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { id: true, name: true, email: true },
          });
          if (user) return user;
        }

        // Fallback: search by email
        if (session.email) {
          const userByEmail = await prisma.user.findUnique({
            where: { email: session.email },
            select: { id: true, name: true, email: true },
          });
          if (userByEmail) return userByEmail;
        }
      }
    }

    // Default user fallback
    const defaultUser = await getOrCreateDefaultUser();
    return defaultUser;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return getOrCreateDefaultUser();
  }
}

export async function getOrCreateDefaultUser(): Promise<UserSession> {
  try {
    const existing = await prisma.user.findFirst({
      select: { id: true, name: true, email: true },
    });
    if (existing) return existing;

    const passwordHash = await hashPassword("password123");
    const newUser = await prisma.user.create({
      data: {
        name: "Masum Islam Badsha",
        email: "badsha@jobdesk.app",
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    });

    return newUser;
  } catch (error) {
    console.error("getOrCreateDefaultUser error:", error);
    return {
      id: "6a88725ba01b079d48660890",
      name: "Masum Islam Badsha",
      email: "badsha@jobdesk.app",
    };
  }
}
