import Link from "next/link";
import Image from "next/image";
import { SignOutButton } from "../auth";
import { useTenantDisplay } from "~/hooks/useTenantIdentity";

const navLinkClass =
  "rounded-md px-2 py-2 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)] transition-all hover:bg-white/5 hover:text-white sm:px-3";

export interface HeaderViewProps {
  /** Signed-in user's display name; omit when signed out. */
  accountName?: string | null;
  tenantLabel: string;
  tenantId: string | null;
  tenantResolving: boolean;
}

/**
 * Presentational header. Below `sm` the account/tenant panel drops to its own
 * full-width row so a long tenant name never squeezes the nav or overflows.
 */
export function HeaderView({
  accountName,
  tenantLabel,
  tenantId,
  tenantResolving,
}: HeaderViewProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--console-border)] bg-[var(--console-dark)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3 rounded-md transition-opacity hover:opacity-90"
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

        <nav className="ml-auto flex items-center gap-1 sm:gap-3">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          <Link href="/setup" className={navLinkClass}>
            Docs
          </Link>
        </nav>

        {accountName != null && (
          <div className="console-panel order-last flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2 sm:order-none sm:w-auto sm:max-w-[22rem] sm:flex-col sm:items-end sm:gap-0 sm:px-4 sm:text-right lg:max-w-[28rem]">
            <div className="flex min-w-0 max-w-[45%] items-center gap-2 sm:max-w-full">
              <span className="status-dot status-dot-active shrink-0" />
              <span className="truncate text-xs font-medium text-white">{accountName}</span>
            </div>
            <div
              className="min-w-0 flex-1 truncate text-right font-mono text-xs text-[var(--warning-amber)] sm:mt-0.5 sm:w-full sm:flex-none"
              title={tenantId ? `${tenantLabel}\nTenant ID: ${tenantId}` : tenantLabel}
            >
              {tenantResolving ? (
                <span className="text-[var(--text-muted)]">Resolving tenant...</span>
              ) : (
                <>
                  <span className="sr-only">Tenant: </span>
                  {tenantLabel}
                </>
              )}
            </div>
          </div>
        )}

        {accountName != null && <SignOutButton />}
      </div>
    </header>
  );
}

export function Header() {
  const { account, label, tenantId, status, verified } = useTenantDisplay();

  return (
    <HeaderView
      accountName={account ? (account.name ?? account.username) : null}
      tenantLabel={label}
      tenantId={tenantId}
      tenantResolving={status === "loading" && !verified}
    />
  );
}
