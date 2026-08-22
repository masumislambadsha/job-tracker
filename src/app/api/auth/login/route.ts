import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, setSessionCookie, getOrCreateDefaultUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, isDemo } = await request.json();

    // Support 1-click Demo Login
    if (isDemo) {
      const demoUser = await getOrCreateDefaultUser();
      await setSessionCookie(demoUser);
      return NextResponse.json({ user: demoUser, success: true });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json({ user: sessionUser, success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
