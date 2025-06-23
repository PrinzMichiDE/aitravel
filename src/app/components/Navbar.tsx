'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export default function Navbar() {
  const { user, error, isLoading } = useUser();

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
            <div className="ml-4 flex items-center md:ml-6">
              {isLoading && (
                <p className="text-gray-500">Lädt...</p>
              )}
              {!isLoading && !user && (
                <a
                  href="/api/auth/login"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Anmelden
                </a>
              )}
              {user && (
                <div className="ml-3 relative flex items-center">
                  <p className="text-gray-700 mr-4">
                    Hallo, {user.name}
                  </p>
                  <a
                    href="/api/auth/logout"
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    Abmelden
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 