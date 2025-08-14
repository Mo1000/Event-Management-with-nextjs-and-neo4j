import { Ticket, Event, User, driver } from '../models';
import { TicketStatusEnum, IEvent } from '@/types/models';
import { v4 as uuidv4 } from 'uuid';

export interface PurchaseTicketData {
  userId: string;
  eventId: string;
  quantity?: number;
}

export class TicketService {
  // Purchase tickets for an event
  static async purchaseTicket(purchaseData: PurchaseTicketData) {
    try {
      const { userId, eventId, quantity = 1 } = purchaseData;
      
      const user = await User.find(userId);
      const event = await Event.find(eventId);
      
      if (!user || !event) {
        throw new Error('User or Event not found');
      }

      const availableTickets = Number((event as any).get('availableTickets'));
      const eventPrice = Number((event as any).get('price'));
      
      if (availableTickets < quantity) {
        throw new Error(`Only ${availableTickets} tickets available`);
      }

      const tickets = [];
      
      // Create tickets for the quantity requested
      for (let i = 0; i < quantity; i++) {
        const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const ticket = await Ticket.create({
          id: uuidv4(),
          ticketNumber,
          price: eventPrice,
          purchasedAt: new Date(),
          status: TicketStatusEnum.ACTIVE,
        });

        // Create relationships using relationship keys from schema
        await user.relateTo(ticket, 'tickets');
        await ticket.relateTo(event, 'event');
        
        tickets.push(ticket);
      }

      // Update available tickets count
      await event.update({
        availableTickets: Number(availableTickets) - Number(quantity),
        updatedAt: new Date(),
      } as any);

      return {
        message: `Successfully purchased ${quantity} ticket(s)`,
        tickets,
        totalAmount: eventPrice * quantity,
      };
    } catch (error) {
      throw new Error(`Failed to purchase ticket: ${error}`);
    }
  }

  // Get all tickets
  static async getAllTickets() {
    try {
      const tickets = await Ticket.all();
      return tickets;
    } catch (error) {
      throw new Error(`Failed to get tickets: ${error}`);
    }
  }

  // Get ticket by ID
  static async getTicketById(id: string) {
    try {
      const ticket = await Ticket.find(id);
      return ticket;
    } catch (error) {
      throw new Error(`Failed to get ticket: ${error}`);
    }
  }

  // Get ticket by ticket number
  static async getTicketByNumber(ticketNumber: string) {
    try {
      const ticket = await Ticket.first('ticketNumber', ticketNumber);
      return ticket;
    } catch (error) {
      throw new Error(`Failed to get ticket by number: ${error}`);
    }
  }

  // Get tickets for a specific event
  static async getTicketsForEvent(eventId: string) {
    try {
      const event = await Event.find(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      const tickets = await event.get('tickets');
      return tickets;
    } catch (error) {
      throw new Error(`Failed to get tickets for event: ${error}`);
    }
  }

  // Cancel a ticket
  static async cancelTicket(ticketId: string, userId: string) {
    try {
      const ticket = await Ticket.find(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Verify the ticket belongs to the user
      const user = await User.find(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user owns this ticket
      const userTickets = (await user.get('tickets')) as any[];
      const ownsTicket = Array.isArray(userTickets)
        ? userTickets.some((t: any) => (t as any).get('id') === ticketId)
        : false;
      
      if (!ownsTicket) {
        throw new Error('You can only cancel your own tickets');
      }

      // Update ticket status
      await ticket.update({
        status: TicketStatusEnum.CANCELLED,
      } as any);

      // Get the event and increase available tickets
      const relatedEvent = (await ticket.get('event')) as any;
      if (relatedEvent) {
        const currentAvailable = Number(relatedEvent.get('availableTickets')) || 0;
        await relatedEvent.update({
          availableTickets: currentAvailable + 1,
          updatedAt: new Date(),
        } as any);
      }

      return { message: 'Ticket cancelled successfully', ticket };
    } catch (error) {
      throw new Error(`Failed to cancel ticket: ${error}`);
    }
  }

  // Use a ticket (mark as used)
  static async useTicket(ticketId: string) {
    try {
      const ticket = await Ticket.find(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const currentStatus = (ticket as any).get('status');
      if (currentStatus !== TicketStatusEnum.ACTIVE) {
        throw new Error(`Ticket is ${currentStatus} and cannot be used`);
      }

      await ticket.update({
        status: TicketStatusEnum.USED,
        usedAt: new Date(),
      } as any);

      return { message: 'Ticket marked as used successfully', ticket };
    } catch (error) {
      throw new Error(`Failed to use ticket: ${error}`);
    }
  }

  // Get ticket with event and user details
  static async getTicketWithDetails(ticketId: string) {
    try {
      const ticket = await Ticket.find(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const event = (await ticket.get('event')) as any;
      const purchaserResult = await (driver as any).cypher(
        'MATCH (u:User)-[:PURCHASED]->(t:Ticket {id: $ticketId}) RETURN u',
        { ticketId }
      );
      const purchaser = purchaserResult?.records?.[0]?.get('u') ?? null;

      return {
        ticket,
        event: event ?? null,
        purchaser,
      };
    } catch (error) {
      throw new Error(`Failed to get ticket details: ${error}`);
    }
  }

  // Get ticket statistics for an event
  static async getEventTicketStats(eventId: string) {
    try {
      const event = await Event.find(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const totalTickets = Number((event as any).get('totalTickets'));
      const available = Number((event as any).get('availableTickets'));
      const soldTickets = totalTickets - available;

      // Get ticket status breakdown
      const ticketStats = await (driver as any).cypher(
        `MATCH (e:Event {id: $eventId})-[:HAS_TICKETS]-(t:Ticket)
         RETURN t.status as status, count(t) as count`,
        { eventId }
      );

      return {
        totalTickets,
        availableTickets: available,
        soldTickets,
        statusBreakdown: ticketStats,
      };
    } catch (error) {
      throw new Error(`Failed to get event ticket stats: ${error}`);
    }
  }
}
