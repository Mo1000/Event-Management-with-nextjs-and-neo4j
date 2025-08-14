import { NextRequest, NextResponse } from 'next/server';
import { TicketService } from '../../../../../services/ticketService';

// POST /api/tickets/[id]/cancel - Cancel a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const result = await TicketService.cancelTicket(params.id, userId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
