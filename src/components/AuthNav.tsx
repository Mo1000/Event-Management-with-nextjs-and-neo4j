"use client";

import { UserRole } from "@/types/models";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, User, Shield, Calendar } from "lucide-react";
import Link from "next/link";

export const AuthNav = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className='flex items-center space-x-4'>
        <Link
          href='/login'
          className='text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors'
        >
          Sign In
        </Link>
        <Link
          href='/register'
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const getRoleIcon = (roles: string[]) => {
    if (roles.includes(UserRole.ADMIN))
      return <Shield className='w-4 h-4 text-red-500' />;
    if (roles.includes(UserRole.ORGANIZER))
      return <Calendar className='w-4 h-4 text-blue-500' />;
    return <User className='w-4 h-4 text-green-500' />;
  };

  const getRoleLabel = (roles: string[]) => {
    if (roles.includes(UserRole.ADMIN)) return "Admin";
    if (roles.includes(UserRole.ORGANIZER)) return "Organizer";
    return "User";
  };

  return (
    <div className='flex items-center space-x-4'>
      <div className='flex items-center space-x-3'>
        <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
          <span className='text-white font-medium text-sm'>
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </span>
        </div>
        <div className='text-right'>
          <div className='text-sm font-medium text-gray-900'>
            {user.firstName} {user.lastName}
          </div>
          <div className='flex items-center space-x-1 text-xs text-gray-500'>
            {getRoleIcon(user.roles || [])}
            <span>{getRoleLabel(user.roles || [])}</span>
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        className='flex items-center space-x-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors'
        title='Logout'
      >
        <LogOut className='w-4 h-4' />
        <span>Logout</span>
      </button>
    </div>
  );
};
