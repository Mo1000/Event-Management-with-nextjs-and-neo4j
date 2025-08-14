import { User, driver } from '../models';
import { v4 as uuidv4 } from 'uuid';
import neo4j from 'neo4j-driver';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/models';

export interface CreateUserData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roles?: UserRole[];
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export class UserService {
  // Create a new user
  static async createUser(userData: CreateUserData) {
    try {
      const {
        email,
        username,
        firstName,
        lastName,
        password,
        roles,
        isActive,
      } = userData;

      // hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const userRoles: UserRole[] = roles && roles.length ? roles : [UserRole.USER];
      const now = new Date();

      const created = await User.create({
        id: uuidv4(),
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
        roles: userRoles.join(',') as unknown as UserRole[],
        isActive: typeof isActive === 'boolean' ? isActive : true,
        createdAt: now,
        updatedAt: now,
      });

      const json = created.toJson();
      if (json && 'password' in json) {
        delete (json as any).password;
      }
      return json;
    } catch (error) {
      console.log(error);
      
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  // Get all users
  static async getAllUsers() {
    try {
      const users = await User.all();
      return users.toJson()
    } catch (error) {
      throw new Error(`Failed to get users: ${error}`);
    }
  }

  // Paginated list of users with optional search and role filter
  static async listUsers(options: {
    page?: number;
    limit?: number;
    q?: string;
    role?: string;
    countOnly?: boolean;
  }) {
    const { page = 1, limit = 20, q, role, countOnly = false } = options || {};

    try {
      const safeLimit = Math.max(1, limit);
      const safePage = Math.max(1, page);
      const skip = (safePage - 1) * safeLimit;

      // Build WHERE clause
      const where: string[] = [];
      const params: Record<string, any> = {};
      if (q && q.trim()) {
        where.push(
          "(toLower(u.email) CONTAINS toLower($q) OR toLower(u.username) CONTAINS toLower($q) OR toLower(u.firstName) CONTAINS toLower($q) OR toLower(u.lastName) CONTAINS toLower($q))"
        );
        params.q = q.trim();
      }
      if (role && role.trim()) {
        // roles stored as comma-separated string; substring match is acceptable here
        where.push("u.roles CONTAINS $role");
        params.role = role.trim();
      }
      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

      // Count
      const countQuery = `MATCH (u:User) ${whereClause} RETURN count(u) AS total`;
      const countRes = await (driver as any).cypher(countQuery, params);
      const totalVal = countRes.records[0]?.get("total");
      const total = typeof totalVal?.toNumber === 'function' ? totalVal.toNumber() : Number(totalVal) || 0;
      const totalPages = Math.max(1, Math.ceil(total / safeLimit));

      if (countOnly) {
        return { items: [], total, page: safePage, limit: safeLimit, totalPages };
      }

      // Page of items
      const listQuery = `
        MATCH (u:User)
        ${whereClause}
        RETURN u
        ORDER BY u.createdAt
        SKIP $skip LIMIT $limit
      `;
      const listParams = { ...params, skip: neo4j.int(skip), limit: neo4j.int(safeLimit) };
      const listRes = await (driver as any).cypher(listQuery, listParams);
      const items = listRes.records.map((r: any) => {
        const node = r.get('u');
        const props = node.properties || {};
        return { ...props };
      });

      return { items, total, page: safePage, limit: safeLimit, totalPages };
    } catch (error) {
      throw new Error(`Failed to list users: ${error}`);
    }
  }

  // Get user by ID
  static async getUserById(id: string) {
    try {
      const user = await User.find(id);
      return user.toJson()
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    try {
      const user = await User.first('email', email);
      return user.toJson()
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error}`);
    }
  }

  // Update user
  static async updateUser(id: string, updateData: UpdateUserData) {
    try {
      const user = await User.find(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      const updatedUser = await user.update({
        ...updateData,
        updatedAt: new Date(),
      });
      return updatedUser.toJson();
    } catch (error) {
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  // Delete user
  static async deleteUser(id: string) {
    try {
      const user = await User.find(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.delete();
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  // Get user's purchased tickets
  static async getUserTickets(userId: string) {
    try {
      const user = await User.find(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const tickets = await user.get('tickets');
      return tickets
    } catch (error) {
      throw new Error(`Failed to get user tickets: ${error}`);
    }
  }

  // Get user's liked events
  static async getUserLikedEvents(userId: string) {
    try {
      const user = await User.find(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const likedEvents = await user.get('likedEvents');
      return likedEvents;
    } catch (error) {
      throw new Error(`Failed to get user liked events: ${error}`);
    }
  }

  // Get user's created events
  static async getUserCreatedEvents(userId: string) {
    try {
      const user = await User.find(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const createdEvents = await user.get('createdEvents');
      return createdEvents;
    } catch (error) {
      throw new Error(`Failed to get user created events: ${error}`);
    }
  }
}
