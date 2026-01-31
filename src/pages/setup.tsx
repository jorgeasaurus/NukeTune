import Head from "next/head";
import Link from "next/link";
import { GradientBackground } from "~/components/ui/GradientBackground";
import { Navigation } from "~/components/ui/Navigation";

export default function Setup() {
  return (
    <>
      <Head>
        <title>Setup Guide - NukeTune</title>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="shortcut icon" href="/logo.png" />
      </Head>

      <div className="min-h-screen bg-[var(--void-black)]">
        <GradientBackground />

        <div className="relative z-10">
          <Navigation />

          <main className="mx-auto max-w-4xl px-4 pt-32 pb-12">
            <div className="mb-8">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--danger-red)]">
                {"//"} DOCUMENTATION
              </span>
              <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-white">
                Getting Started
              </h1>
            </div>

            <div className="space-y-12">
              <p className="text-lg text-[var(--text-dim)]">
                NukeTune is ready to use out of the box. Sign in with your
                Microsoft account and start managing your Intune environment.
              </p>

              {/* Step 1 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--terminal-green)]/10 font-mono text-sm font-bold text-[var(--terminal-green)]">
                    01
                  </span>
                  <h2 className="font-display text-xl font-semibold text-white">
                    Sign In
                  </h2>
                </div>
                <ol className="console-panel space-y-2 p-4 text-sm text-[var(--text-dim)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--terminal-green)]">$</span>
                    Click the &quot;Sign in with Microsoft&quot; button
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--terminal-green)]">$</span>
                    Select your cloud environment (Commercial, GCC High, DoD, etc.)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--terminal-green)]">$</span>
                    Authenticate with your Microsoft account
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--terminal-green)]">$</span>
                    If prompted, grant admin consent for the required permissions
                  </li>
                </ol>
              </section>

              {/* Step 2 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--warning-amber)]/10 font-mono text-sm font-bold text-[var(--warning-amber)]">
                    02
                  </span>
                  <h2 className="font-display text-xl font-semibold text-white">
                    Select Categories
                  </h2>
                </div>
                <p className="mb-4 text-sm text-[var(--text-dim)]">
                  On the dashboard, select the Intune object categories you want to delete:
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Managed Devices",
                    "Applications",
                    "Configuration Profiles",
                    "Compliance Policies",
                    "Scripts",
                    "Groups",
                    "Filters",
                    "Autopilot Profiles",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-lg border border-[var(--console-border)] bg-[var(--console-panel)] p-3 text-sm text-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger-red)]" />
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              {/* Step 3 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--danger-red)]/10 font-mono text-sm font-bold text-[var(--danger-red)]">
                    03
                  </span>
                  <h2 className="font-display text-xl font-semibold text-white">
                    Preview & Confirm
                  </h2>
                </div>
                <ol className="console-panel space-y-2 p-4 text-sm text-[var(--text-dim)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--terminal-green)]">$</span>
                    Click &quot;Preview Deletion&quot; to see all objects that will be affected
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--terminal-green)]">$</span>
                    Review the list carefully - this shows actual data from your tenant
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--terminal-green)]">$</span>
                    Type <code className="rounded bg-[var(--danger-red)]/20 px-2 py-0.5 font-mono text-[var(--danger-red)]">DELETE</code> to confirm
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--terminal-green)]">$</span>
                    Monitor the progress as objects are deleted
                  </li>
                </ol>
              </section>

              {/* Required Permissions */}
              <section>
                <h2 className="font-display mb-4 text-xl font-semibold text-white">
                  Required Permissions
                </h2>
                <p className="mb-4 text-sm text-[var(--text-dim)]">
                  The signed-in user must have one of the following Intune administrator roles:
                </p>
                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--terminal-green)]/30 bg-[var(--terminal-green)]/5 px-4 py-2 text-sm text-[var(--terminal-green)]">
                    <span className="status-dot status-dot-active" />
                    Intune Administrator
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--terminal-green)]/30 bg-[var(--terminal-green)]/5 px-4 py-2 text-sm text-[var(--terminal-green)]">
                    <span className="status-dot status-dot-active" />
                    Global Administrator
                  </div>
                </div>

                <div className="console-panel overflow-hidden">
                  <div className="console-panel-header">
                    <span className="console-panel-title">API Permissions Used</span>
                  </div>
                  <div className="divide-y divide-[var(--console-border)]">
                    {[
                      "DeviceManagementManagedDevices.ReadWrite.All",
                      "DeviceManagementServiceConfig.ReadWrite.All",
                      "DeviceManagementConfiguration.ReadWrite.All",
                      "DeviceManagementApps.ReadWrite.All",
                      "Policy.ReadWrite.ConditionalAccess",
                      "DeviceManagementRBAC.ReadWrite.All",
                    ].map((permission) => (
                      <div
                        key={permission}
                        className="px-4 py-3 text-xs font-mono text-cyan-400 transition-colors hover:bg-white/[0.02]"
                      >
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Warning */}
              <div className="banner-warning p-6">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-[var(--warning-amber)]">
                  <svg
                    className="h-5 w-5"
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
                  Important Warnings
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-[var(--warning-amber)]/70">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--warning-amber)]" />
                    Deletions are permanent and cannot be undone
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--warning-amber)]" />
                    Only use NukeTune with test/dev tenants unless you fully understand the consequences
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--warning-amber)]" />
                    Always review the preview before confirming deletion
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--warning-amber)]" />
                    Back up important configurations before proceeding
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--warning-amber)]" />
                    The deletion log can be exported for audit purposes
                  </li>
                </ul>
              </div>

              {/* Multi-Cloud */}
              <div className="console-panel p-6">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-cyan-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                  Multi-Cloud Support
                </h3>
                <p className="mt-4 text-sm text-[var(--text-dim)]">
                  NukeTune supports multiple Microsoft cloud environments:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-[var(--text-dim)]">
                  <li>Global (Commercial)</li>
                  <li>US Government (GCC High)</li>
                  <li>US Government (DoD)</li>
                  <li>Germany</li>
                  <li>China (21Vianet)</li>
                </ul>
                <p className="mt-4 text-sm text-[var(--text-dim)]">
                  Select your environment when signing in.
                </p>
              </div>

              {/* Back Button */}
              <div className="flex gap-4">
                <Link href="/" className="btn-terminal inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
