"use client";

import { useEffect, useState } from "react";
import {
  Ticket,
  Search,
  Filter,
  Calendar,
  User,
  DollarSign,
  Clock,
  Eye,
} from "lucide-react";
import type { ITicket, IEvent, IUser } from "@/types/models";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, eventsRes, usersRes] = await Promise.all([
        fetch("/api/tickets"),
        fetch("/api/events"),
        fetch("/api/users"),
      ]);

      const ticketsData = await ticketsRes.json();
      const eventsData = await eventsRes.json();
      const usersData = await usersRes.json();

      setTickets(ticketsData.data || []);
      setEvents(eventsData.data || []);
      setUsers(usersData.data || []);
    } catch (error) {
      console.error("Failed to load tickets data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getEventById = (eventId: string) => {
    return events.find((event) => event.id === eventId);
  };

  const getUserById = (userId: string) => {
    return users.find((user) => user.id === userId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "USED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.id
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || ticket.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["ACTIVE", "CANCELLED", "USED"];

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
          <h1 className='text-3xl font-bold text-gray-900'>Tickets</h1>
          <p className='text-gray-600 mt-1'>
            View and manage ticket transactions
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='text-sm text-gray-600'>
            Total: {tickets.length} tickets
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            <input
              type='text'
              placeholder='Search tickets...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            title='Filter by status'
            aria-label='Filter by status'
          >
            <option value=''>All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredTickets.map((ticket) => {
          const event = getEventById(ticket.eventId || "");
          const user = getUserById(ticket.userId || "");

          return (
            <div
              key={ticket.id}
              className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'
            >
              <div className='h-32 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center'>
                <Ticket className='w-12 h-12 text-white opacity-80' />
              </div>

              <div className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Ticket #{ticket.id.slice(0, 8)}
                    </h3>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        ticket.status || ""
                      )}`}
                    >
                      {ticket.status || "UNKNOWN"}
                    </span>
                  </div>
                  <button
                    className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
                    title='View ticket details'
                  >
                    <Eye className='w-4 h-4' />
                  </button>
                </div>

                <div className='space-y-3'>
                  {event && (
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <Calendar className='w-4 h-4' />
                      <span className='font-medium'>{event.title}</span>
                    </div>
                  )}

                  {user && (
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <User className='w-4 h-4' />
                      <span>
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  )}

                  {event && (
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <DollarSign className='w-4 h-4' />
                      <span>${event.price}</span>
                    </div>
                  )}

                  {ticket.purchasedAt && (
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <Clock className='w-4 h-4' />
                      <span>
                        Purchased:{" "}
                        {new Date(ticket.purchasedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {ticket.usedAt && (
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <Clock className='w-4 h-4' />
                      <span>
                        Used: {new Date(ticket.usedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className='mt-4 pt-4 border-t border-gray-100'>
                  <div className='flex items-center justify-between text-xs text-gray-500'>
                    <span>
                      Created:{" "}
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                    <span>ID: {ticket.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTickets.length === 0 && (
        <div className='text-center py-12'>
          <Ticket className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No tickets found
          </h3>
          <p className='text-gray-600'>
            {searchTerm || selectedStatus
              ? "Try adjusting your search or filters."
              : "Tickets will appear here once they are purchased."}
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {tickets.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Ticket Summary
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {tickets.filter((t) => t.status === "ACTIVE").length}
              </div>
              <div className='text-sm text-gray-600'>Active Tickets</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {tickets.filter((t) => t.status === "USED").length}
              </div>
              <div className='text-sm text-gray-600'>Used Tickets</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {tickets.filter((t) => t.status === "CANCELLED").length}
              </div>
              <div className='text-sm text-gray-600'>Cancelled Tickets</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {tickets.length}
              </div>
              <div className='text-sm text-gray-600'>Total Tickets</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
