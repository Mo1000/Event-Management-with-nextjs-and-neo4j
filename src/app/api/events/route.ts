import { NextRequest, NextResponse } from "next/server";
import { EventService } from "../../../services/eventService";

// GET /api/events - Get all events
export async function GET() {
  try {
    const events = await EventService.getAllEvents();
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      location,
      eventDate,
      price,
      totalTickets,
      category,
      imageUrl,
      creatorId,
    } = body;

    if (
      !title ||
      !description ||
      !location ||
      !eventDate ||
      price === undefined ||
      totalTickets === undefined ||
      !category ||
      !creatorId
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const event = await EventService.createEvent({
      title,
      description,
      location,
      eventDate: new Date(eventDate) as any,
      price: Number(price),
      totalTickets: Number(totalTickets),
      category,
      imageUrl,
      creatorId,
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
