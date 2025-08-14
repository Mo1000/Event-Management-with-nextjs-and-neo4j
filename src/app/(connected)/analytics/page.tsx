"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  Ticket,
  DollarSign,
  Activity,
} from "lucide-react";
import type { IEvent, IUser, ITicket } from "@/types/models";

export default function AnalyticsPage() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const [eventsRes, usersRes, ticketsRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/users"),
        fetch("/api/tickets"),
      ]);

      const eventsData = await eventsRes.json();
      const usersData = await usersRes.json();
      const ticketsData = await ticketsRes.json();

      setEvents(eventsData.data || []);
      setUsers(usersData.data || []);
      setTickets(ticketsData.data || []);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRevenueData = () => {
    const monthlyRevenue: { [key: string]: number } = {};

    tickets.forEach((ticket) => {
      if (ticket.purchasedAt) {
        const month = new Date(ticket.purchasedAt).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const event = events.find((e) => e.id === ticket.eventId);
        if (event) {
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + event.price;
        }
      }
    });

    return Object.entries(monthlyRevenue).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  };

  const getEventCategoryData = () => {
    const categoryCount: { [key: string]: number } = {};
    events.forEach((event) => {
      if (event.category) {
        categoryCount[event.category] =
          (categoryCount[event.category] || 0) + 1;
      }
    });
    return Object.entries(categoryCount);
  };

  const getTicketStatusData = () => {
    const statusCount: { [key: string]: number } = {};
    tickets.forEach((ticket) => {
      const status = ticket.status || "UNKNOWN";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    return Object.entries(statusCount);
  };

  const getTopEvents = () => {
    const eventTicketCount: { [key: string]: number } = {};
    tickets.forEach((ticket) => {
      if (ticket.eventId) {
        eventTicketCount[ticket.eventId] =
          (eventTicketCount[ticket.eventId] || 0) + 1;
      }
    });

    return Object.entries(eventTicketCount)
      .map(([eventId, count]) => ({
        eventId,
        count,
        event: events.find((e) => e.id === eventId),
      }))
      .filter((item) => item.event)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  const revenueData = getRevenueData();
  const categoryData = getEventCategoryData();
  const statusData = getTicketStatusData();
  const topEvents = getTopEvents();

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Analytics</h1>
          <p className='text-gray-600 mt-1'>
            Insights and performance metrics for your events
          </p>
        </div>
        <div className='flex items-center space-x-2 text-sm text-gray-600'>
          <Activity className='w-4 h-4' />
          <span>Real-time data</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Revenue</p>
              <p className='text-3xl font-bold text-gray-900'>
                $
                {tickets
                  .reduce((sum, ticket) => {
                    const event = events.find((e) => e.id === ticket.eventId);
                    return sum + (event?.price || 0);
                  }, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
              <DollarSign className='w-6 h-6 text-green-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Events</p>
              <p className='text-3xl font-bold text-gray-900'>
                {events.length}
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
              <p className='text-3xl font-bold text-gray-900'>{users.length}</p>
            </div>
            <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
              <Users className='w-6 h-6 text-purple-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Tickets</p>
              <p className='text-3xl font-bold text-gray-900'>
                {tickets.length}
              </p>
            </div>
            <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center'>
              <Ticket className='w-6 h-6 text-yellow-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Insights */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Revenue Trend */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Revenue Trend
          </h2>
          {revenueData.length > 0 ? (
            <div className='space-y-3'>
              {revenueData.map(([month, revenue]) => (
                <div key={month} className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>{month}</span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-green-500 h-2 rounded-full'
                        style={{
                          width: `${
                            (revenue /
                              Math.max(...revenueData.map(([_, r]) => r))) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className='text-sm font-medium text-gray-900'>
                      ${revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <TrendingUp className='w-12 h-12 mx-auto mb-3 text-gray-400' />
              <p>No revenue data available</p>
            </div>
          )}
        </div>

        {/* Event Categories */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Event Categories
          </h2>
          {categoryData.length > 0 ? (
            <div className='space-y-3'>
              {categoryData.map(([category, count]) => (
                <div
                  key={category}
                  className='flex items-center justify-between'
                >
                  <span className='text-sm text-gray-600'>{category}</span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-blue-500 h-2 rounded-full'
                        style={{ width: `${(count / events.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className='text-sm font-medium text-gray-900'>
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <Calendar className='w-12 h-12 mx-auto mb-3 text-gray-400' />
              <p>No category data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Status and Top Events */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Ticket Status Distribution */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Ticket Status Distribution
          </h2>
          {statusData.length > 0 ? (
            <div className='space-y-3'>
              {statusData.map(([status, count]) => (
                <div key={status} className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>{status}</span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-purple-500 h-2 rounded-full'
                        style={{ width: `${(count / tickets.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className='text-sm font-medium text-gray-900'>
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <Ticket className='w-12 h-12 mx-auto mb-3 text-gray-400' />
              <p>No ticket data available</p>
            </div>
          )}
        </div>

        {/* Top Performing Events */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Top Performing Events
          </h2>
          {topEvents.length > 0 ? (
            <div className='space-y-3'>
              {topEvents.map((item, index) => (
                <div
                  key={item.eventId}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium'>
                      {index + 1}
                    </span>
                    <span className='text-sm text-gray-900 font-medium truncate max-w-32'>
                      {item.event?.title}
                    </span>
                  </div>
                  <span className='text-sm font-medium text-gray-900'>
                    {item.count} tickets
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <BarChart3 className='w-12 h-12 mx-auto mb-3 text-gray-400' />
              <p>No event performance data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Recent Activity
        </h2>
        <div className='space-y-3'>
          {tickets.slice(0, 10).map((ticket) => {
            const event = events.find((e) => e.id === ticket.eventId);
            const user = users.find((u) => u.id === ticket.userId);

            return (
              <div
                key={ticket.id}
                className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'
              >
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <Ticket className='w-4 h-4 text-blue-600' />
                </div>
                <div className='flex-1'>
                  <p className='text-sm text-gray-900'>
                    <span className='font-medium'>
                      {user?.firstName} {user?.lastName}
                    </span>{" "}
                    purchased a ticket for{" "}
                    <span className='font-medium'>{event?.title}</span>
                  </p>
                  <p className='text-xs text-gray-500'>
                    {ticket.purchasedAt
                      ? new Date(ticket.purchasedAt).toLocaleString()
                      : "Unknown time"}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ticket.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {ticket.status || "UNKNOWN"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
