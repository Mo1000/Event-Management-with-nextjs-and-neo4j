import { Model } from "neode";
import { driver } from "../utils/driver.utils";
import { IUser, IEvent, ITicket } from "@/types/models";

// Define User model
export const User: Model<IUser> = driver.model("User", {
  id: {
    type: "uuid",
    primary: true,
    required: true,
  },
  email: {
    type: "string",
    unique: true,
    required: true,
  },
  username: {
    type: "string",
    unique: true,
    required: true,
  },
  roles: {
    type: "string",
    required: true,
    default: JSON.stringify(["USER"]), // optional default
  },
  password: {
    type: "string",
    required: true,
  },

  isActive: {
    type: "boolean",
    default: true,
  },
  firstName: {
    type: "string",
    required: true,
  },
  lastName: {
    type: "string",
    required: true,
  },
  createdAt: {
    type: "datetime",
    default: () => new Date(),
  },
  updatedAt: {
    type: "datetime",
    default: () => new Date(),
  },
  // Relationships
  tickets: {
    type: "relationship",
    relationship: "PURCHASED",
    direction: "out",
    target: "Ticket",
  },
  likedEvents: {
    type: "relationship",
    relationship: "LIKES",
    direction: "out",
    target: "Event",
  },
  createdEvents: {
    type: "relationship",
    relationship: "CREATED",
    direction: "out",
    target: "Event",
  },
});

// Define Event model
export const Event: Model<IEvent> = driver.model("Event", {
  id: {
    type: "uuid",
    primary: true,
    required: true,
  },
  title: {
    type: "string",
    required: true,
  },
  description: {
    type: "string",
    required: true,
  },
  location: {
    type: "string",
    required: true,
  },
  eventDate: {
    type: "datetime",
    required: true,
  },
  price: {
    type: "number",
    required: true,
  },
  totalTickets: {
    type: "number",
    required: true,
  },
  availableTickets: {
    type: "number",
    required: true,
  },
  category: {
    type: "string",
    required: true,
  },
  imageUrl: {
    type: "string",
  },

  capacity: {
    type: "number",
  },
  organizerId: {
    type: "string",
  },

  isArchived: {
    type: "boolean",
    default: false,
  },

  date: {
    type: "datetime",
    default: () => new Date(),
  },
  createdAt: {
    type: "datetime",
    default: () => new Date(),
  },
  updatedAt: {
    type: "datetime",
    default: () => new Date(),
  },
  // Relationships
  tickets: {
    type: "relationship",
    relationship: "HAS_TICKETS",
    direction: "in",
    target: "Ticket",
  },
  likedByUsers: {
    type: "relationship",
    relationship: "LIKED_BY",
    direction: "in",
    target: "User",
  },
  creator: {
    type: "relationship",
    relationship: "CREATED_BY",
    direction: "in",
    target: "User",
  },
});

// Define Ticket model
export const Ticket: Model<ITicket> = driver.model("Ticket", {
  id: {
    type: "uuid",
    primary: true,
    required: true,
  },
  ticketNumber: {
    type: "string",
    unique: true,
    required: true,
  },
  purchasedAt: {
    type: "datetime",
    default: () => new Date(),
  },
  usedAt: {
    type: "datetime",
  },
  status: {
    type: "string",
    default: "ACTIVE", // ACTIVE, CANCELLED, USED
  },
  price: {
    type: "number",
    required: true,
  },
  // Relationships
  event: {
    type: "relationship",
    relationship: "FOR_EVENT",
    direction: "out",
    target: "Event",
  },
});

// Define relationships
// User.relationship('PURCHASED', Ticket, 'out', 'tickets');
// Ticket.relationship('FOR_EVENT', Event, 'out', 'event');
// Event.relationship('HAS_TICKETS', Ticket, 'in', 'tickets');

// User.relationship('LIKES', Event, 'out', 'likedEvents');
// Event.relationship('LIKED_BY', User, 'in', 'likedByUsers');

// User.relationship('CREATED', Event, 'out', 'createdEvents');
// Event.relationship('CREATED_BY', User, 'in', 'creator');
export { driver };
