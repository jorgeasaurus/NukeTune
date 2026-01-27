import Link from "next/link";
import { useMsal } from "@azure/msal-react";
import { SignOutButton } from "../auth";

export function Header() {
  const { accounts } = useMsal();
  const account = accounts[0];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/20 transition-all duration-300 group-hover:shadow-red-500/30">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-gradient">NukeTune</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/setup"
            className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
          >
            Setup Guide
          </Link>

          {account && (
            <div className="flex items-center gap-4">
              <div className="glass-subtle rounded-lg px-4 py-2 text-right">
                <div className="text-sm font-medium text-white">
                  {account.name ?? account.username}
                </div>
                <div className="text-xs text-gray-500">{account.tenantId}</div>
              </div>
              <SignOutButton />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
