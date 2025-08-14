import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../services/userService';

// GET /api/users - List users with pagination/search/role and countOnly mode
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const q = searchParams.get('q') || undefined;
    const role = searchParams.get('role') || undefined;
    const countOnly = (searchParams.get('countOnly') || 'false').toLowerCase() === 'true';

    const result = await UserService.listUsers({ page, limit, q, role, countOnly });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, firstName, lastName } = body;

    if (!email || !username || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await UserService.createUser({
      email,
      username,
      firstName,
      lastName,
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
