import moment from "moment";
import { Event, User, driver } from "../models";
import { v4 as uuidv4 } from "uuid";
import neo4j from "neo4j-driver";

export interface CreateEventData {
  title: string;
  description: string;
  location: string;
  eventDate: Date;
  price: number;
  totalTickets: number;
  category: string;
  imageUrl?: string;
  creatorId: string;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  location?: string;
  eventDate?: Date;
  price?: number;
  totalTickets?: number;
  category?: string;
  imageUrl?: string;
  availableTickets?: number;
}

export class EventService {
  // Create a new event
  static async createEvent(eventData: CreateEventData) {
    try {
      const { creatorId, ...eventDetails } = eventData;
      const event = await Event.create({
        id: uuidv4(),
        ...eventDetails,
        availableTickets: eventDetails.totalTickets,
        date: moment(eventData.eventDate).add(1, "day").toDate() as any,
        capacity: Number(eventData.totalTickets),
        organizerId: creatorId,
        isArchived: false,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      });

      // Create relationship with creator
      const creator = await User.find(creatorId);
      if (creator) {
        // Use relationship key from schema: 'createdEvents'
        await creator.relateTo(event, "createdEvents");
      }

      return event.toJson();
    } catch (error) {
      throw new Error(`Failed to create event: ${error}`);
    }
  }

  // Get all events
  static async getAllEvents() {
    try {
      const events = await Event.all();
      return events.toJson();
    } catch (error) {
      throw new Error(`Failed to get events: ${error}`);
    }
  }

  // Get events with pagination, optional search, and date range filters
  static async listEvents(options: {
    page?: number;
    limit?: number;
    q?: string;
    from?: string; // ISO string
    to?: string; // ISO string
    includeArchived?: boolean;
    countOnly?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      q,
      from,
      to,
      includeArchived = false,
      countOnly = false,
    } = options || {};

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

    // Build WHERE clause
    const where: string[] = [];
    const params: Record<string, any> = {};
    if (!includeArchived) {
      // Include nodes without isArchived (treat as not archived)
      where.push("coalesce(e.isArchived, false) = false");
    }
    if (q && q.trim()) {
      where.push(
        "(toLower(e.title) CONTAINS toLower($q) OR toLower(e.description) CONTAINS toLower($q))"
      );
      params.q = q.trim();
    }
    if (from) {
      // Support string or temporal stored values by casting with datetime()
      where.push(
        "EXISTS(e.eventDate) AND datetime(e.eventDate) >= datetime($from)"
      );
      params.from = from;
    }
    if (to) {
      where.push(
        "EXISTS(e.eventDate) AND datetime(e.eventDate) <= datetime($to)"
      );
      params.to = to;
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Count
    const countQuery = `MATCH (e:Event) ${whereClause} RETURN count(e) AS total`;
    const countRes = await (driver as any).cypher(countQuery, params);
    const totalVal = countRes.records[0]?.get("total");
    const total =
      typeof totalVal?.toNumber === "function"
        ? totalVal.toNumber()
        : Number(totalVal) || 0;

    let items: any[] = [];
    if (!countOnly) {
      // Page of items
      const listQuery = `
        MATCH (e:Event)
        ${whereClause}
        RETURN e
        ORDER BY datetime(e.eventDate)
        SKIP $skip LIMIT $limit
      `;
      const listParams = {
        ...params,
        skip: neo4j.int(skip),
        limit: neo4j.int(Math.max(1, limit)),
      };
      const listRes = await (driver as any).cypher(listQuery, listParams);
      items = listRes.records.map((r: any) => {
        const node = r.get("e");
        const props = node.properties || {};
        return { ...props };
      });
    }

    return {
      items,
      total,
      page: Math.max(1, page),
      limit: Math.max(1, limit),
      totalPages: Math.max(1, Math.ceil(total / Math.max(1, limit))),
    };
  }

  // Get event by ID
  static async getEventById(id: string) {
    try {
      const event = await Event.find(id);
      return event.toJson();
    } catch (error) {
      throw new Error(`Failed to get event: ${error}`);
    }
  }

  // Get events by category
  static async getEventsByCategory(category: string) {
    try {
      const result = await (driver as any).cypher(
        "MATCH (e:Event {category: $category}) RETURN e",
        { category }
      );
      return result.toJson();
    } catch (error) {
      throw new Error(`Failed to get events by category: ${error}`);
    }
  }

  // Get upcoming events
  static async getUpcomingEvents() {
    try {
      const currentDate = new Date();
      const result = await (driver as any).cypher(
        "MATCH (e:Event) WHERE e.eventDate > $currentDate RETURN e ORDER BY e.eventDate",
        { currentDate: currentDate.toISOString() }
      );
      return result.toJson();
    } catch (error) {
      throw new Error(`Failed to get upcoming events: ${error}`);
    }
  }

  // Update event
  static async updateEvent(id: string, updateData: UpdateEventData) {
    try {
      const event = await Event.find(id);
      if (!event) {
        throw new Error("Event not found");
      }

      // If totalTickets is being updated, adjust availableTickets accordingly
      if (updateData.totalTickets !== undefined) {
        const currentAvailable = Number(event.get("availableTickets") as any);
        const currentTotal = Number(event.get("totalTickets") as any);
        const soldTickets = currentTotal - currentAvailable;
        updateData.availableTickets =
          Number(updateData.totalTickets) - soldTickets;
      }

      const updatedEvent = await (event as any).update({
        ...updateData,
        updatedAt: new Date(),
      });
      return updatedEvent.toJson();
    } catch (error) {
      throw new Error(`Failed to update event: ${error}`);
    }
  }

  // Delete event
  static async deleteEvent(id: string) {
    try {
      const event = await Event.find(id);
      if (!event) {
        throw new Error("Event not found");
      }

      await event.delete();
      return { message: "Event deleted successfully" };
    } catch (error) {
      throw new Error(`Failed to delete event: ${error}`);
    }
  }

  // Like an event
  static async likeEvent(userId: string, eventId: string) {
    try {
      const user = await User.find(userId);
      const event = await Event.find(eventId);

      if (!user || !event) {
        throw new Error("User or Event not found");
      }

      // Use relationship key from schema: 'likedEvents'
      const likeRel = await user.relateTo(event, "likedEvents");
      return { message: "Event liked successfully", relationship: likeRel };
    } catch (error) {
      throw new Error(`Failed to like event: ${error}`);
    }
  }

  // Unlike an event
  static async unlikeEvent(userId: string, eventId: string) {
    try {
      const user = await User.find(userId);
      const event = await Event.find(eventId);

      if (!user || !event) {
        throw new Error("User or Event not found");
      }

      // Use relationship key from schema: 'likedEvents' (cast to satisfy TS typings)
      await (user as any).detachFrom(event, "likedEvents");
      return { message: "Event unliked successfully" };
    } catch (error) {
      throw new Error(`Failed to unlike event: ${error}`);
    }
  }

  // Get event's liked by users
  static async getEventLikes(eventId: string) {
    try {
      const event = await Event.find(eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      const likedByUsers = await event.get("likedByUsers");
      return likedByUsers;
    } catch (error) {
      throw new Error(`Failed to get event likes: ${error}`);
    }
  }

  // Get event creator
  static async getEventCreator(eventId: string) {
    try {
      const event = await Event.find(eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      const creator = await event.get("creator");
      return creator;
    } catch (error) {
      throw new Error(`Failed to get event creator: ${error}`);
    }
  }

  // Search events by title or description
  static async searchEvents(query: string) {
    try {
      const result = await (driver as any).cypher(
        "MATCH (e:Event) WHERE toLower(e.title) CONTAINS toLower($query) OR toLower(e.description) CONTAINS toLower($query) RETURN e ORDER BY e.eventDate",
        { query }
      );
      return result.toJson();
    } catch (error) {
      throw new Error(`Failed to search events: ${error}`);
    }
  }
}
