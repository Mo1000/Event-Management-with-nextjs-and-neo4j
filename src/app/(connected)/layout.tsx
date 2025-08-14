import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Calendar,
  Users,
  Home,
  Ticket,
  BarChart3,
  LogOut,
  User,
} from "lucide-react";
import { AuthNav } from "@/components/AuthNav";

export default function ConnectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='flex h-screen bg-gray-50'>
      {/* Sidebar */}
      <div className='w-64 bg-white shadow-lg border-r border-gray-200'>
        <div className='p-6'>
          <Link href='/' className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
              <Ticket className='w-5 h-5 text-white' />
            </div>
            <span className='text-xl font-bold text-gray-900'>EventHub</span>
          </Link>
        </div>

        <nav className='px-4 space-y-2'>
          <Link
            href='/'
            className='flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group'
          >
            <Home className='w-5 h-5 group-hover:text-blue-600' />
            <span>Dashboard</span>
          </Link>

          <Link
            href='/events'
            className='flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group'
          >
            <Calendar className='w-5 h-5 group-hover:text-blue-600' />
            <span>Events</span>
          </Link>

          <Link
            href='/users'
            className='flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group'
          >
            <Users className='w-5 h-5 group-hover:text-blue-600' />
            <span>Users</span>
          </Link>

          <Link
            href='/tickets'
            className='flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group'
          >
            <Ticket className='w-5 h-5 group-hover:text-blue-600' />
            <span>Tickets</span>
          </Link>

          <Link
            href='/analytics'
            className='flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group'
          >
            <BarChart3 className='w-5 h-5 group-hover:text-blue-600' />
            <span>Analytics</span>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        <header className='bg-white shadow-sm border-b border-gray-200 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-semibold text-gray-900'>EventHub</h1>
            <AuthNav />
          </div>
        </header>

        <main className='flex-1 overflow-y-auto bg-gray-50 p-6'>
          {children}
        </main>
      </div>
    </div>
  );
};
