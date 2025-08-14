"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  User,
  Eye,
} from "lucide-react";
import type { IUser } from "@/types/models";

export default function UsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<IUser>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm({});
    setEditingId(null);
    setShowForm(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        const res = await fetch(`/api/users/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Create failed");
      }
      resetForm();
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "Submit failed");
    }
  };

  const edit = (u: IUser) => {
    setEditingId(u.id);
    setForm(u);
    setShowForm(true);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    );
  });

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
          <h1 className='text-3xl font-bold text-gray-900'>Users</h1>
          <p className='text-gray-600 mt-1'>
            Manage user accounts and profiles
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors'
        >
          <Plus className='w-5 h-5' />
          <span>Add User</span>
        </button>
      </div>

      {/* Search */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
          <input
            type='text'
            placeholder='Search users...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>
      </div>

      {/* User Form */}
      {showForm && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold text-gray-900'>
              {editingId ? "Edit User" : "Add New User"}
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
                placeholder='First Name'
                value={form.firstName || ""}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                required={!editingId}
              />
              <input
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Last Name'
                value={form.lastName || ""}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required={!editingId}
              />
              <input
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Username'
                value={form.username || ""}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required={!editingId}
              />
              <input
                type='email'
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Email'
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required={!editingId}
              />
            </div>

            <div className='flex items-center space-x-4'>
              <button
                type='submit'
                className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors'
              >
                {editingId ? "Update User" : "Add User"}
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

      {/* Users Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'
          >
            <div className='p-6'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center space-x-3'>
                  <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
                    <span className='text-white font-semibold text-lg'>
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className='text-sm text-gray-600'>@{user.username}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => edit(user)}
                    className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
                    title='Edit user'
                  >
                    <Edit className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => del(user.id)}
                    className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                    title='Delete user'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <Mail className='w-4 h-4' />
                  <span>{user.email}</span>
                </div>
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <User className='w-4 h-4' />
                  <span>Username: {user.username}</span>
                </div>
              </div>

              <div className='mt-4 pt-4 border-t border-gray-100'>
                <div className='flex items-center justify-between text-xs text-gray-500'>
                  <span>
                    Created:{" "}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <span>ID: {user.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className='text-center py-12'>
          <Users className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No users found
          </h3>
          <p className='text-gray-600'>
            {searchTerm
              ? "Try adjusting your search terms."
              : "Create your first user to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
