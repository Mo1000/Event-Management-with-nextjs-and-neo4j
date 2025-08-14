import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../../services/userService';

// GET /api/users/[id]/events - Get user's created events
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const createdEvents = await UserService.getUserCreatedEvents(params.id);
    return NextResponse.json({ success: true, data: createdEvents });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
