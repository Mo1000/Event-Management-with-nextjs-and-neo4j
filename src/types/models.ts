export interface IBase {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserRole {
  USER = "USER",
  ORGANIZER = "ORGANIZER",
  ADMIN = "ADMIN",
}

export interface IUser extends IBase {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: UserRole[];
  isActive: boolean;
}

export interface IEvent extends IBase {
  title: string;
  description: string;
  location: string;
  eventDate: Date | string; // stored as datetime, represented as JS Date
  price: number;
  totalTickets: number;
  availableTickets: number;
  category: string;
  imageUrl?: string;
  date: Date;
  capacity: number;
  organizerId: string;
  isArchived: boolean;
}

export enum TicketStatusEnum {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  USED = "USED",
}

export interface ITicket extends IBase {
  ticketNumber: string;
  status?: TicketStatusEnum;
  userId?: string;
  eventId?: string;
  purchasedAt?: Date;
  usedAt?: Date;
  price: number;
}

export interface IAuthContext {
  user: IUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<IUser>) => Promise<boolean>;
  isLoading: boolean;
}

export interface ILoginForm {
  email: string;
  password: string;
}

export interface IRegisterForm {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}
