import { CategorySelector, SelectionActionBar } from "~/components/categories";
import { useTenantDisplay } from "~/hooks/useTenantIdentity";

/**
 * Dashboard body: target tenant, warning, category selection and the sticky
 * action bar. `pb-36` keeps the last cards clear of the fixed bar.
 */
export function DashboardMain() {
  const tenant = useTenantDisplay();

  return (
    <main className="mx-auto max-w-7xl px-4 pb-36 pt-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-md border border-[var(--console-border)] bg-[var(--console-panel)] px-3 py-1.5 mb-4">
          <span className="status-dot status-dot-danger" />
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
            Control Panel Active
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">
          Intune Environment Reset
        </h1>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          Select target categories, preview affected objects, execute deletion protocol
        </p>
      </div>

      {/* Target Tenant */}
      <div className="console-panel mb-4 flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
            Target Tenant
          </div>
          <div
            className="mt-1 break-words font-display text-lg font-bold sm:text-xl text-[var(--warning-amber)]"
            title={tenant.tenantId ? `Tenant ID: ${tenant.tenantId}` : undefined}
          >
            {tenant.status === "loading" && !tenant.verified
              ? "Resolving tenant..."
              : tenant.label}
          </div>
          {tenant.status === "failed" && (
            <p className="mt-1 text-xs text-[var(--warning-amber)]/80">
              {tenant.domain
                ? "Could not read the organization name; showing the signed-in account's domain."
                : "Could not read the organization name; showing the tenant ID only."}{" "}
              Verify this is the tenant you intend to modify.
            </p>
          )}
        </div>
        {tenant.tenantId && (
          <div className="shrink-0 font-mono text-xs text-[var(--text-muted)] sm:text-right">
            Tenant ID
            <div className="break-all text-[var(--text-dim)]">{tenant.tenantId}</div>
          </div>
        )}
      </div>

      {/* Warning Banner */}
      <div className="banner-danger mb-8 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--critical-red)]/20">
            <svg
              className="h-5 w-5 text-[var(--critical-red)]"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--critical-red)]">
              Destructive Operation Warning
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--critical-red)]">
              Objects deleted from Intune cannot be recovered. This includes
              device enrollments, app assignments, and policy configurations.
              Ensure you have backups before proceeding.
            </p>
          </div>
        </div>
      </div>

      <CategorySelector />

      <SelectionActionBar />
    </main>
  );
}
