import { NextRequest, NextResponse } from "next/server";
import { EventService } from "../../../services/eventService";

// GET /api/events - Get all events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const q = searchParams.get("q") || undefined;
    const from = searchParams.get("from") || undefined; // ISO string
    const to = searchParams.get("to") || undefined; // ISO string
    const includeArchived = (searchParams.get("includeArchived") || "false").toLowerCase() === "true";
    const countOnly = (searchParams.get("countOnly") || "false").toLowerCase() === "true";

    const result = await EventService.listEvents({ page, limit, q, from, to, includeArchived, countOnly });

    return NextResponse.json({ success: true, ...result });
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
