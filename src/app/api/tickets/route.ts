import { NextRequest, NextResponse } from "next/server";
import { driver } from "../../../utils/driver.utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countOnly = (searchParams.get("countOnly") || "false").toLowerCase() === "true";

    const session = driver.session();
    if (countOnly) {
      const countRes = await session.run("MATCH (t:Ticket) RETURN count(t) as total");
      await session.close();
      const totalVal = countRes.records[0]?.get("total");
      const total = typeof totalVal?.toNumber === "function" ? totalVal.toNumber() : Number(totalVal) || 0;
      return NextResponse.json({ success: true, items: [], total, page: 1, limit: 0, totalPages: 1 });
    }

    const result = await session.run("MATCH (t:Ticket) RETURN t");
    await session.close();

    const tickets = result.records.map((record) => {
      const ticket = record.get("t").properties;
      return {
        ...ticket,
        id: ticket.id,
        createdAt: ticket.createdAt ? new Date(ticket.createdAt) : undefined,
        updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt) : undefined,
        purchasedAt: ticket.purchasedAt
          ? new Date(ticket.purchasedAt)
          : undefined,
        usedAt: ticket.usedAt ? new Date(ticket.usedAt) : undefined,
      };
    });

    return NextResponse.json({ success: true, items: tickets, total: tickets.length, page: 1, limit: tickets.length, totalPages: 1 });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventId, quantity = 1 } = body;

    if (!userId || !eventId) {
      return NextResponse.json(
        { error: "User ID and Event ID are required" },
        { status: 400 }
      );
    }

    const session = driver.session();

    // Get event details for price
    const eventResult = await session.run(
      "MATCH (e:Event {id: $eventId}) RETURN e",
      { eventId }
    );
    if (eventResult.records.length === 0) {
      await session.close();
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventResult.records[0].get("e").properties;

    // Create tickets
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticketId = crypto.randomUUID();
      const now = new Date().toISOString();

      await session.run(
        `
        CREATE (t:Ticket {
          id: $ticketId,
          userId: $userId,
          eventId: $eventId,
          status: 'ACTIVE',
          purchasedAt: $purchasedAt,
          createdAt: $createdAt,
          updatedAt: $updatedAt
        })
      `,
        {
          ticketId,
          userId,
          eventId,
          purchasedAt: now,
          createdAt: now,
          updatedAt: now,
        }
      );

      tickets.push({
        id: ticketId,
        userId,
        eventId,
        status: "ACTIVE",
        purchasedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    await session.close();

    return NextResponse.json({ data: tickets });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
