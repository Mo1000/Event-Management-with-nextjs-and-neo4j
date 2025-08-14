"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Clock,
  Heart,
} from "lucide-react";
import type { IEvent, IUser } from "@/types/models";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  canCreateEvent,
  canEditEvent,
  canDeleteEvent,
  canBuyTickets,
} from "@/utils/auth.utils";

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<IEvent[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<IEvent> & { creatorId?: string }>(
    {}
  );
  const [actionUserId, setActionUserId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  // Pagination and filters for server-side fetching
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(searchTerm ? { q: searchTerm } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }).toString();
      const [evRes, uRes] = await Promise.all([
        fetch(`/api/events?${qs}`, { cache: "no-store" }),
        // Fetch a limited page of users for selectors
        fetch(`/api/users?page=1&limit=100`),
      ]);
      const ev = await evRes.json();
      const us = await uRes.json();
      setEvents(ev.items || []);
      setTotal(ev.total || 0);
      setTotalPages(ev.totalPages || 1);
      // Keep local page in sync with backend-safe page value if returned
      if (typeof ev.page === "number" && ev.page !== page) setPage(ev.page);
      setUsers(us.items || []);
      if (!actionUserId && (us.items || []).length > 0)
        setActionUserId((us.items || [])[0].id);
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchTerm, from, to]);

  const resetForm = () => {
    setForm({});
    setEditingId(null);
    setShowForm(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        totalTickets: Number(form.totalTickets),
        eventDate: form.eventDate,
        imageUrl:
          form.imageUrl ||
          "https://res.cloudinary.com/dqskb8nm3/image/upload/v1754563501/ndemin/a7ektcrisooy2m1l1iut.jpg",
      } as any;

      if (editingId) {
        const res = await fetch(`/api/events/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        if (!form.creatorId) throw new Error("Select a creator");
        const res = await fetch(`/api/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            creatorId: form.creatorId,
          }),
        });
        if (!res.ok) throw new Error("Create failed");
      }
      resetForm();
      await load();
    } catch (e: any) {
      setError(e?.message || "Submit failed");
    }
  };

  const edit = (eItem: IEvent) => {
    if (!canEditEvent(user, eItem.organizerId)) {
      setError("You don't have permission to edit this event");
      return;
    }
    setEditingId(eItem.id);
    setForm({
      id: eItem.id,
      title: eItem.title,
      description: eItem.description,
      location: eItem.location,
      eventDate: eItem.eventDate,
      price: eItem.price,
      totalTickets: eItem.totalTickets,
      category: eItem.category,
      imageUrl: eItem.imageUrl,
    });
    setShowForm(true);
  };

  const del = async (id: string) => {
    const event = events.find((e) => e.id === id);
    if (!event || !canDeleteEvent(user, event.organizerId)) {
      setError("You don't have permission to delete this event");
      return;
    }

    if (!confirm("Delete this event?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await load();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    }
  };

  const buyTicket = async (eventId: string) => {
    if (!canBuyTickets(user)) {
      setError("You must be logged in to buy tickets");
      return;
    }

    if (!actionUserId) {
      setError("Please select a user first");
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: actionUserId,
          eventId,
          quantity,
        }),
      });
      if (!res.ok) throw new Error("Purchase failed");
      await load();
      setQuantity(1);
    } catch (e: any) {
      setError(e?.message || "Purchase failed");
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const cats = events.map((e) => e.category).filter(Boolean);
    return [...new Set(cats)];
  }, [events]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Events</h1>
            <p className='text-gray-600 mt-1'>Browse and manage events</p>
          </div>
          {canCreateEvent(user) && (
            <button
              onClick={() => setShowForm(true)}
              className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors'
            >
              <Plus className='w-5 h-5' />
              <span>Create Event</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search events...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              title='Filter by category'
              aria-label='Filter by category'
            >
              <option value=''>All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className='flex items-center space-x-2'>
              <Filter className='w-5 h-5 text-gray-400' />
              <span className='text-sm text-gray-600'>Filters</span>
            </div>
          </div>
        </div>

        {/* Event Form */}
        {showForm && canCreateEvent(user) && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold text-gray-900'>
                {editingId ? "Edit Event" : "Create New Event"}
              </h2>
              <button
                onClick={resetForm}
                className='text-gray-400 hover:text-gray-600'
              >
                ✕
              </button>
            </div>

            {error && (
              <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
                {error}
              </div>
            )}

            <form onSubmit={submit} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <input
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Event Title'
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
                <input
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Location'
                  value={form.location || ""}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  required
                />
                <input
                  type='date'
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  value={
                    form.eventDate
                      ? new Date(form.eventDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setForm({ ...form, eventDate: e.target.value })
                  }
                  required
                />
                <input
                  type='number'
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Price'
                  value={form.price || ""}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  required
                />
                <input
                  type='number'
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Total Tickets'
                  value={form.totalTickets || ""}
                  onChange={(e) =>
                    setForm({ ...form, totalTickets: Number(e.target.value) })
                  }
                  required
                />
                <input
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Category'
                  value={form.category || ""}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  required
                />
                <input
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Image URL'
                  value={form.imageUrl || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      imageUrl: e.target.value,
                    })
                  }
                />
              </div>

              <textarea
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Event Description'
                rows={3}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />

              {!editingId && (
                <select
                  value={form.creatorId || ""}
                  onChange={(e) =>
                    setForm({ ...form, creatorId: e.target.value })
                  }
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  required
                  title='Select event creator'
                  aria-label='Select event creator'
                >
                  <option value=''>Select Creator</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              )}

              <div className='flex items-center space-x-4'>
                <button
                  type='submit'
                  className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors'
                >
                  {editingId ? "Update Event" : "Create Event"}
                </button>
                <button
                  type='button'
                  onClick={resetForm}
                  className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {events.map((event) => (
            <div
              key={event.id}
              className='bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100'
            >
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className='w-full h-48 object-cover'
                />
              ) : (
                <div className='h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                  <Calendar className='w-16 h-16 text-white opacity-80' />
                </div>
              )}

              <div className='p-6'>
                <div className='flex items-start justify-between mb-3'>
                  <h3 className='text-xl font-semibold text-gray-900 line-clamp-2'>
                    {event.title}
                  </h3>
                  <div className='flex items-center space-x-2'>
                    {canEditEvent(user, event.organizerId) && (
                      <button
                        onClick={() => edit(event)}
                        className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
                        title='Edit event'
                      >
                        <Edit className='w-4 h-4' />
                      </button>
                    )}
                    {canDeleteEvent(user, event.organizerId) && (
                      <button
                        onClick={() => del(event.id)}
                        className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                        title='Delete event'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    )}
                  </div>
                </div>

                <p className='text-gray-600 mb-4 line-clamp-2'>
                  {event.description}
                </p>

                <div className='space-y-2 mb-4'>
                  <div className='flex items-center space-x-2 text-sm text-gray-600'>
                    <MapPin className='w-4 h-4' />
                    <span>{event.location}</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-gray-600'>
                    <Clock className='w-4 h-4' />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-gray-600'>
                    <DollarSign className='w-4 h-4' />
                    <span>${event.price}</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-gray-600'>
                    <Users className='w-4 h-4' />
                    <span>
                      {event.availableTickets || event.totalTickets} tickets
                      available
                    </span>
                  </div>
                </div>

                {canBuyTickets(user) && (
                  <div className='flex items-center space-x-2'>
                    <select
                      value={actionUserId}
                      onChange={(e) => setActionUserId(e.target.value)}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      title='Select user to buy tickets'
                      aria-label='Select user to buy tickets'
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                    <input
                      type='number'
                      min='1'
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className='w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      title='Number of tickets to buy'
                      aria-label='Number of tickets to buy'
                    />
                    <button
                      onClick={() => buyTicket(event.id)}
                      className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors'
                    >
                      Buy
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className='text-center py-12'>
            <Calendar className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No events found
            </h3>
            <p className='text-gray-600'>
              Try adjusting your search or create a new event.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {events.length > 0 && (
          <div className='mt-8 flex items-center justify-between'>
            <div className='text-sm text-gray-600'>
              Page {page} of {totalPages} • {total} results
            </div>
            <div className='flex items-center gap-2'>
              <button
                className='px-3 py-2 rounded border text-sm disabled:opacity-50'
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <button
                className='px-3 py-2 rounded border text-sm disabled:opacity-50'
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
              <select
                className='ml-2 px-2 py-2 border rounded text-sm'
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value));
                }}
              >
                {[12, 20, 24, 48].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
