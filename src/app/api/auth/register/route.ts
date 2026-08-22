import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { SEED_PORTALS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
      },
    });

    // Automatically seed the 24 verified portals for the new user!
    for (const portalData of SEED_PORTALS) {
      await prisma.portal.create({
        data: {
          userId: user.id,
          name: portalData.name,
          url: portalData.url,
          tier: portalData.tier,
          notes: portalData.notes,
        },
      });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json({ user: sessionUser, success: true }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
