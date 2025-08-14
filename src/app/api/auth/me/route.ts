import { NextRequest, NextResponse } from "next/server";
import { driver } from "../../../../utils/driver.utils";
import jwt from "jsonwebtoken";
import { getUserRoles } from "@/utils/auth.utils";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (!decoded.userId) {
        return NextResponse.json({ message: "Invalid token" }, { status: 401 });
      }

      const session = driver.session();

      // Get user by ID
      const result = await session.run(
        "MATCH (u:User {id: $userId}) RETURN u",
        { userId: decoded.userId }
      );

      await session.close();

      if (result.records.length === 0) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
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

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      user.roles = getUserRoles(user.roles);

      return NextResponse.json({
        user: {
          ...userWithoutPassword,
          id: user.id,
          createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
        },
        token,
      });
    } catch (jwtError) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
