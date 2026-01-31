import Link from "next/link";
import Image from "next/image";
import { useMsal } from "@azure/msal-react";
import { SignOutButton } from "../auth";

const navLinkClass =
  "rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)] transition-all hover:bg-white/5 hover:text-white";

export function Header() {
  const { accounts } = useMsal();
  const account = accounts[0];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--console-border)] bg-[var(--console-dark)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo.png"
            alt="NukeTune"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg"
          />
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              NUKE
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-[var(--danger-red)]">
              TUNE
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          <Link href="/setup" className={navLinkClass}>
            Docs
          </Link>

          {account && (
            <div className="flex items-center gap-3">
              <div className="console-panel rounded-lg px-4 py-2 text-right">
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-active" />
                  <span className="text-xs font-medium text-white">
                    {account.name ?? account.username}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] font-mono text-[var(--text-muted)]">
                  {account.tenantId?.slice(0, 8)}...
                </div>
              </div>
              <SignOutButton />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
