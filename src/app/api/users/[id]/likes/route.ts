import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../../services/userService';

// GET /api/users/[id]/likes - Get user's liked events
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const likedEvents = await UserService.getUserLikedEvents(params.id);
    return NextResponse.json({ success: true, data: likedEvents });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
