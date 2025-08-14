import { NextRequest, NextResponse } from 'next/server';
import { TicketService } from '../../../../../services/ticketService';

// GET /api/events/[id]/tickets - Get tickets for an event
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tickets = await TicketService.getTicketsForEvent(params.id);
    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
