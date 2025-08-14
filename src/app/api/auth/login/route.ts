import { NextRequest, NextResponse } from "next/server";
import { driver } from "../../../../utils/driver.utils";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserRoles } from "@/utils/auth.utils";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const session = driver.session();

    // Find user by email
    const result = await session.run(
      "MATCH (u:User {email: $email}) RETURN u",
      { email }
    );

    await session.close();

    if (result.records.length === 0) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.records[0].get("u").properties;

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { message: "Account is deactivated" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles: user.roles || ["USER"],
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    user.roles = getUserRoles(user.roles);
    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        ...userWithoutPassword,
        id: user.id,
        createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
