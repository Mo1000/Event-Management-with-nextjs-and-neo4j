import { User } from '../models';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
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
      const user = await User.create({
        id: uuidv4(),
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return user.toJson();
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
