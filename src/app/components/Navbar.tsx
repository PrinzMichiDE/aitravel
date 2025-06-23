'use client';

import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Navbar() {
  const { user, isLoading } = useUser();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-800">
              ✈️ AI-Travel
            </Link>
          </div>
          <div className="flex items-center">
            {isLoading ? null : user ? (
              <>
                <span className="mr-4 text-gray-700 font-semibold">
                  {user.name || user.email}
                </span>
                <Link
                  href="/api/auth/logout"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Abmelden
                </Link>
              </>
            ) : (
              <Link
                href="/api/auth/login"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Anmelden
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 