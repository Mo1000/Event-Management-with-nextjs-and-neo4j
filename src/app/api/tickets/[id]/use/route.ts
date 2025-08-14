import { NextRequest, NextResponse } from 'next/server';
import { TicketService } from '../../../../../services/ticketService';

// POST /api/tickets/[id]/use - Mark ticket as used
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await TicketService.useTicket(params.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
