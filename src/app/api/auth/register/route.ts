import { NextRequest, NextResponse } from "next/server";
import { User } from "../../../../models";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "../../../../types/models";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function POST(request: NextRequest) {
  try {
    const { email, username, firstName, lastName, password, roles } =
      await request.json();

    if (!email || !username || !firstName || !lastName || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingByEmail = await User.first("email", email);
    if (existingByEmail) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingByUsername = await User.first("username", username);
    if (existingByUsername) {
      return NextResponse.json(
        { message: "Username already taken" },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = crypto.randomUUID();
    const now = new Date();
    const userRoles: UserRole[] = (roles as UserRole[] | undefined) || [
      UserRole.USER,
    ];

    await User.create({
      id: userId,
      email,
      username,
      firstName,
      lastName,
      password: hashedPassword,
      roles: userRoles.join(",") as unknown as UserRole[],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        email,
        roles: userRoles,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const user = {
      id: userId,
      email,
      username,
      firstName,
      lastName,
      roles: userRoles,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    return NextResponse.json({
      message: "Registration successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
