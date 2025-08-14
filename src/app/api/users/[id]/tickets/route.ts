import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../../services/userService';

// GET /api/users/[id]/tickets - Get user's tickets
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tickets = await UserService.getUserTickets(params.id);
    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
