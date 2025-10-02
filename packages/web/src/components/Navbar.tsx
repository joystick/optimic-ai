"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex gap-4">
          <Link href="/" className="hover:text-gray-300">
            Home
          </Link>
          <Link href="/about" className="hover:text-gray-300">
            About
          </Link>
          {session && (
            <Link href="/workspace" className="hover:text-gray-300">
              Workspace
            </Link>
          )}
        </div>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <span>{session.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/" className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
