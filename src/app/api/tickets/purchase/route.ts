import { NextRequest, NextResponse } from 'next/server';
import { TicketService } from '../../../../services/ticketService';

// POST /api/tickets/purchase - Purchase ticket(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventId, quantity } = body;
    if (!userId || !eventId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or eventId' },
        { status: 400 }
      );
    }

    const result = await TicketService.purchaseTicket({ userId, eventId, quantity });
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
