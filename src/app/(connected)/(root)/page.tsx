"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  Ticket,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import type { IEvent, IUser, ITicket } from "@/types/models";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateEvent } from "@/utils/auth.utils";
import Link from "next/link";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalTickets: 0,
    totalRevenue: 0,
  });
  const [recentEvents, setRecentEvents] = useState<IEvent[]>([]);
  const [recentUsers, setRecentUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch totals via countOnly, and small recent lists in parallel
      const [eventsCntRes, usersCntRes, ticketsCntRes, eventsListRes, usersListRes] = await Promise.all([
        fetch("/api/events?countOnly=true"),
        fetch("/api/users?countOnly=true"),
        fetch("/api/tickets?countOnly=true"),
        fetch("/api/events?page=1&limit=5"),
        fetch("/api/users?page=1&limit=5"),
      ]);

      const eventsCnt = await eventsCntRes.json();
      const usersCnt = await usersCntRes.json();
      const ticketsCnt = await ticketsCntRes.json();
      const eventsList = await eventsListRes.json();
      const usersList = await usersListRes.json();

      setStats({
        totalEvents: Number(eventsCnt.total || 0),
        totalUsers: Number(usersCnt.total || 0),
        totalTickets: Number(ticketsCnt.total || 0),
        totalRevenue: 0,
      });

      setRecentEvents(eventsList.items || []);
      setRecentUsers(usersList.items || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
          <p className='text-gray-600 mt-1'>
            Welcome back, {user?.firstName}! Manage your events and tickets
          </p>
        </div>
        {canCreateEvent(user) && (
          <Link
            href='/events'
            className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors'
          >
            <Plus className='w-5 h-5' />
            <span>Create Event</span>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Events</p>
              <p className='text-3xl font-bold text-gray-900'>
                {stats.totalEvents}
              </p>
            </div>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
              <Calendar className='w-6 h-6 text-blue-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Users</p>
              <p className='text-3xl font-bold text-gray-900'>
                {stats.totalUsers}
              </p>
            </div>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
              <Users className='w-6 h-6 text-green-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Tickets</p>
              <p className='text-3xl font-bold text-gray-900'>
                {stats.totalTickets}
              </p>
            </div>
            <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
              <Ticket className='w-6 h-6 text-purple-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Revenue</p>
              <p className='text-3xl font-bold text-gray-900'>
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center'>
              <TrendingUp className='w-6 h-6 text-yellow-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Events */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
          <div className='p-6 border-b border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Recent Events
            </h2>
            <p className='text-sm text-gray-600 mt-1'>
              Latest events in your system
            </p>
          </div>
          <div className='p-6'>
            {recentEvents.length === 0 ? (
              <div className='text-center py-8'>
                <Calendar className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-500'>No events yet</p>
                <p className='text-sm text-gray-400'>
                  {canCreateEvent(user)
                    ? "Create your first event to get started"
                    : "Events will appear here once they are created"}
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                  >
                    <div className='flex-1'>
                      <h3 className='font-medium text-gray-900'>
                        {event.title}
                      </h3>
                      <p className='text-sm text-gray-600'>{event.location}</p>
                      <p className='text-xs text-gray-500'>
                        {new Date(event.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Link
                        href={`/events/${event.id}`}
                        className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
                        title='View event details'
                      >
                        <Eye className='w-4 h-4' />
                      </Link>
                      {canCreateEvent(user) && (
                        <Link
                          href={`/events/edit/${event.id}`}
                          className='p-2 text-gray-400 hover:text-green-600 transition-colors'
                          title='Edit event'
                        >
                          <Edit className='w-4 h-4' />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className='mt-6'>
              <Link
                href='/events'
                className='text-blue-600 hover:text-blue-700 text-sm font-medium'
              >
                View all events →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
          <div className='p-6 border-b border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Recent Users
            </h2>
            <p className='text-sm text-gray-600 mt-1'>
              Latest registered users
            </p>
          </div>
          <div className='p-6'>
            {recentUsers.length === 0 ? (
              <div className='text-center py-8'>
                <Users className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-500'>No users yet</p>
                <p className='text-sm text-gray-400'>
                  Users will appear here once they register
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                  >
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
                        <span className='text-white font-medium text-sm'>
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className='font-medium text-gray-900'>
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className='text-sm text-gray-600'>{user.email}</p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Link
                        href={`/users/${user.id}`}
                        className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
                        title='View user details'
                      >
                        <Eye className='w-4 h-4' />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className='mt-6'>
              <Link
                href='/users'
                className='text-blue-600 hover:text-blue-700 text-sm font-medium'
              >
                View all users →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
        <div className='p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>Quick Actions</h2>
          <p className='text-sm text-gray-600 mt-1'>
            Common tasks and shortcuts
          </p>
        </div>
        <div className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Link
              href='/events'
              className='p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors'>
                  <Calendar className='w-5 h-5 text-blue-600' />
                </div>
                <div>
                  <h3 className='font-medium text-gray-900'>Browse Events</h3>
                  <p className='text-sm text-gray-600'>
                    View and search events
                  </p>
                </div>
              </div>
            </Link>

            {canCreateEvent(user) && (
              <Link
                href='/events'
                className='p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group'
              >
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors'>
                    <Users className='w-5 h-5 text-green-600' />
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>Manage Events</h3>
                    <p className='text-sm text-gray-600'>
                      Create and edit events
                    </p>
                  </div>
                </div>
              </Link>
            )}

            <Link
              href='/tickets'
              className='p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors'>
                  <Ticket className='w-5 h-5 text-purple-600' />
                </div>
                <div>
                  <h3 className='font-medium text-gray-900'>My Tickets</h3>
                  <p className='text-sm text-gray-600'>View your tickets</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
