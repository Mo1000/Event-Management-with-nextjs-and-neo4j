import type { IUser } from "../types/models";
import { UserRole } from "../types/models";

export const hasRole = (user: IUser | null, role: UserRole): boolean => {
  return user?.roles?.includes(role) || false;
};

export const hasAnyRole = (user: IUser | null, roles: UserRole[]): boolean => {
  return user?.roles?.some((role) => roles.includes(role)) || false;
};

export const isAdmin = (user: IUser | null): boolean => {
  return hasRole(user, UserRole.ADMIN);
};

export const isOrganizer = (user: IUser | null): boolean => {
  return hasRole(user, UserRole.ORGANIZER);
};

export const isUser = (user: IUser | null): boolean => {
  return hasRole(user, UserRole.USER);
};

// Only organizers can create events. Admins alone cannot create, but
// a user with both ADMIN and ORGANIZER can (due to ORGANIZER role).
export const canCreateEvent = (user: IUser | null): boolean => {
  return hasRole(user, UserRole.ORGANIZER);
};

export const canEditEvent = (
  user: IUser | null,
  eventOrganizerId: string
): boolean => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isOrganizer(user) && user.id === eventOrganizerId) return true;
  return false;
};

export const canDeleteEvent = (
  user: IUser | null,
  eventOrganizerId: string
): boolean => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isOrganizer(user) && user.id === eventOrganizerId) return true;
  return false;
};

export const canArchiveEvent = (user: IUser | null): boolean => {
  return isAdmin(user);
};

export const canManageUsers = (user: IUser | null): boolean => {
  return isAdmin(user);
};

export const canViewAnalytics = (user: IUser | null): boolean => {
  return hasAnyRole(user, [UserRole.ADMIN, UserRole.ORGANIZER]);
};

export const canBuyTickets = (user: IUser | null): boolean => {
  return !!user; // Any authenticated user can buy tickets
};

export const canLikeEvent = (user: IUser | null): boolean => {
  return !!user; // Any authenticated user can like events
};

export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
  }
};

export const getUserRoles = (roles: string) => {
  return roles.split(",");
};
