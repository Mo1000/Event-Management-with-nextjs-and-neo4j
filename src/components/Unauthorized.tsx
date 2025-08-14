"use client";

import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4'>
      <div className='max-w-md w-full text-center'>
        <div className='mx-auto h-24 w-24 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-6'>
          <Shield className='h-12 w-12 text-white' />
        </div>

        <h1 className='text-4xl font-bold text-gray-900 mb-4'>Access Denied</h1>

        <p className='text-lg text-gray-600 mb-8'>
          You don't have permission to access this page. Please contact an
          administrator if you believe this is an error.
        </p>

        <div className='space-y-4'>
          <Link
            href='/'
            className='inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
            <span>Go to Dashboard</span>
          </Link>

          <div className='text-sm text-gray-500'>
            <p>Need help? Contact support at support@eventhub.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
