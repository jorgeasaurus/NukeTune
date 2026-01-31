import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useIsAuthenticated } from "@azure/msal-react";
import { useState } from "react";
import { SignInButton, CloudEnvironmentSelector } from "~/components/auth";
import { GradientBackground } from "~/components/ui/GradientBackground";
import { Navigation } from "~/components/ui/Navigation";
import { signIn } from "~/lib/auth/authUtils";
import type { CloudEnvironment } from "~/types/cloud";

export default function Home() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const [showCloudSelector, setShowCloudSelector] = useState(false);

  const handleSignInClick = () => {
    setShowCloudSelector(true);
  };

  const handleCloudSelect = async (environment: CloudEnvironment) => {
    setShowCloudSelector(false);
    try {
      await signIn(environment);
      void router.push("/dashboard");
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleCloudSelectorCancel = () => {
    setShowCloudSelector(false);
  };

  return (
    <>
      <Head>
        <title>NukeTune - Intune Environment Reset Tool</title>
        <meta
          name="description"
          content="Reset your Microsoft Intune environment to its original state"
        />
      </Head>

      <div className="relative min-h-screen bg-[var(--void-black)]">
        <GradientBackground />

        <div className="relative z-10">
          <Navigation />

          {/* Hero Section */}
          <section className="container mx-auto px-4 pb-16 pt-32">
            <div className="mx-auto max-w-5xl space-y-8 text-center">
              {/* System Status */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--console-border)] bg-[var(--console-panel)] px-4 py-2">
                <span className="status-dot status-dot-danger" />
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                  Destructive Operations Enabled
                </span>
              </div>

              {/* Title */}
              <h1 className="font-display text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                <span className="glitch-text" data-text="RESET YOUR">
                  RESET YOUR
                </span>
                <br />
                <span className="text-nuclear-animated">INTUNE TENANT</span>
              </h1>

              <p className="terminal-prompt mx-auto max-w-2xl text-lg text-[var(--text-dim)]">
                Delete devices, apps, policies, and configurations from your
                Microsoft Intune environment with surgical precision.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="btn-danger inline-flex items-center justify-center rounded-lg px-8 py-4 text-base"
                  >
                    Control Panel
                  </Link>
                ) : (
                  <SignInButton
                    onClick={handleSignInClick}
                    className="btn-terminal inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base"
                  />
                )}
                <Link
                  href="/setup"
                  className="btn-terminal inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base"
                >
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Documentation
                </Link>
              </div>
            </div>
          </section>

          {/* Cloud Environment Selector */}
          <CloudEnvironmentSelector
            open={showCloudSelector}
            onSelect={handleCloudSelect}
            onCancel={handleCloudSelectorCancel}
          />

          {/* Warning Banner */}
          <section className="container mx-auto px-4 py-8">
            <div className="mx-auto max-w-4xl">
              <div className="banner-warning p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--warning-amber)]/20">
                    <svg
                      className="h-5 w-5 text-[var(--warning-amber)]"
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
                    <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--warning-amber)]">
                      Destructive Operations
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--warning-amber)]/70">
                      This tool performs irreversible deletions. Intended for
                      test/dev environments or complete tenant resets. Always
                      preview before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section
            id="features"
            className="container mx-auto scroll-mt-16 px-4 py-16"
          >
            <div className="mx-auto max-w-6xl">
              <div className="mb-12">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--danger-red)]">
                  {"//"} CAPABILITIES
                </span>
                <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
                  System Features
                </h2>
              </div>

              <div className="stagger-children grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Feature 1 */}
                <div className="card-feature group">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--danger-red)]/10 transition-colors group-hover:bg-[var(--danger-red)]/20">
                    <svg
                      className="h-6 w-6 text-[var(--danger-red)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-white">
                    Safe Preview Mode
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-dim)]">
                    Preview everything that will be deleted before executing.
                    Review items, counts, and categories before committing.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="card-feature group">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--nuke-orange)]/10 transition-colors group-hover:bg-[var(--nuke-orange)]/20">
                    <svg
                      className="h-6 w-6 text-[var(--nuke-orange)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-white">
                    Selective Deletion
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-dim)]">
                    Choose exactly what to delete: devices, apps, configuration
                    profiles, compliance policies, scripts, and more.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="card-feature group">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--warning-amber)]/10 transition-colors group-hover:bg-[var(--warning-amber)]/20">
                    <svg
                      className="h-6 w-6 text-[var(--warning-amber)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-white">
                    Batch Processing
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-dim)]">
                    Delete hundreds of items efficiently with batch operations.
                    Progress tracking and detailed logs for every action.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="card-feature group">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--terminal-green)]/10 transition-colors group-hover:bg-[var(--terminal-green)]/20">
                    <svg
                      className="h-6 w-6 text-[var(--terminal-green)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-white">
                    Detailed Logging
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-dim)]">
                    Complete audit trail of all deletions. Track successes,
                    failures, and skipped items with timestamps.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="card-feature group">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 transition-colors group-hover:bg-cyan-500/20">
                    <svg
                      className="h-6 w-6 text-cyan-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-white">
                    Multi-Cloud Support
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-dim)]">
                    Works with Global, US Government (GCC High & DoD), and other
                    sovereign cloud environments.
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="card-feature group">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                    <svg
                      className="h-6 w-6 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display mb-2 text-lg font-semibold text-white">
                    Secure Authentication
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-dim)]">
                    Uses Microsoft&apos;s official MSAL library for secure OAuth
                    authentication. Your credentials never touch our servers.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section
            id="how-it-works"
            className="container mx-auto scroll-mt-16 px-4 py-16"
          >
            <div className="mx-auto max-w-6xl">
              <div className="mb-12">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--danger-red)]">
                  {"//"} PROCEDURE
                </span>
                <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
                  Execution Protocol
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Step 1 */}
                <div className="console-panel group transition-all duration-300 hover:-translate-y-2 hover:border-[var(--terminal-green)]/50 hover:shadow-[0_0_30px_-10px_var(--terminal-green-glow)]">
                  <div className="console-panel-header">
                    <span className="console-panel-title">
                      <span className="text-[var(--terminal-green)]">01</span>
                      <span className="mx-2 text-[var(--console-border)]">|</span>
                      Authenticate
                    </span>
                    <span className="status-dot status-dot-active" />
                  </div>
                  <div className="p-5">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--terminal-green)]/10 transition-colors group-hover:bg-[var(--terminal-green)]/20">
                      <svg
                        className="h-7 w-7 text-[var(--terminal-green)] transition-transform group-hover:scale-110"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-display mb-2 text-lg font-semibold text-white">
                      Sign In
                    </h3>
                    <p className="text-sm text-[var(--text-dim)]">
                      Authenticate with your Microsoft account and connect to
                      your Intune tenant
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="console-panel group transition-all duration-300 hover:-translate-y-2 hover:border-[var(--warning-amber)]/50 hover:shadow-[0_0_30px_-10px_var(--warning-amber-glow)]">
                  <div className="console-panel-header">
                    <span className="console-panel-title">
                      <span className="text-[var(--warning-amber)]">02</span>
                      <span className="mx-2 text-[var(--console-border)]">|</span>
                      Configure
                    </span>
                    <span className="status-dot status-dot-warning" />
                  </div>
                  <div className="p-5">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--warning-amber)]/10 transition-colors group-hover:bg-[var(--warning-amber)]/20">
                      <svg
                        className="h-7 w-7 text-[var(--warning-amber)] transition-transform group-hover:scale-110"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </div>
                    <h3 className="font-display mb-2 text-lg font-semibold text-white">
                      Select & Preview
                    </h3>
                    <p className="text-sm text-[var(--text-dim)]">
                      Choose categories to delete and preview all items before
                      committing to the operation
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="console-panel group transition-all duration-300 hover:-translate-y-2 hover:border-[var(--critical-red)]/50 hover:shadow-[0_0_30px_-10px_var(--critical-red-glow)]">
                  <div className="console-panel-header">
                    <span className="console-panel-title">
                      <span className="text-[var(--danger-red)]">03</span>
                      <span className="mx-2 text-[var(--console-border)]">|</span>
                      Execute
                    </span>
                    <span className="status-dot status-dot-danger" />
                  </div>
                  <div className="p-5">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--danger-red)]/10 transition-colors group-hover:bg-[var(--danger-red)]/20">
                      <svg
                        className="h-7 w-7 text-[var(--danger-red)] transition-transform group-hover:scale-110"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </div>
                    <h3 className="font-display mb-2 text-lg font-semibold text-white">
                      Confirm & Delete
                    </h3>
                    <p className="text-sm text-[var(--text-dim)]">
                      Confirm and execute the deletion with real-time progress
                      tracking and detailed logs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* What Can Be Deleted Section */}
          <section className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--danger-red)]">
                  {"//"} TARGET CATEGORIES
                </span>
                <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
                  Supported Objects
                </h2>
              </div>

              <div className="stagger-children grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    name: "Devices",
                    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                  },
                  {
                    name: "Applications",
                    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
                  },
                  {
                    name: "Config Profiles",
                    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                  },
                  {
                    name: "Compliance",
                    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                  },
                  {
                    name: "Scripts",
                    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
                  },
                  {
                    name: "Groups",
                    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                  },
                  {
                    name: "Filters",
                    icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
                  },
                  {
                    name: "Autopilot",
                    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="group flex items-center gap-3 rounded-lg border border-[var(--console-border)] bg-[var(--console-panel)] p-4 transition-all hover:-translate-y-1 hover:border-[var(--danger-red)]/40 hover:shadow-lg hover:shadow-[var(--danger-red)]/10"
                  >
                    <svg
                      className="h-5 w-5 shrink-0 text-[var(--danger-red)] transition-transform group-hover:scale-110"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d={item.icon}
                      />
                    </svg>
                    <span className="text-sm font-medium text-white">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-4xl">
              <div className="console-modal console-modal-danger p-8 text-center">
                <div className="hazard-tape" />
                <div className="mb-6 inline-block">
                  <Image
                    src="/logo.png"
                    alt="NukeTune"
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-xl"
                  />
                </div>
                <h2 className="font-display mb-3 text-3xl font-bold text-white">
                  Ready to Reset Your Tenant?
                </h2>
                <p className="mb-6 text-[var(--text-dim)]">
                  {isAuthenticated
                    ? "Access the control panel to manage your Intune environment"
                    : "Sign in with your Microsoft account to access the control panel"}
                </p>
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="btn-danger inline-flex items-center rounded-lg px-8 py-4 text-base"
                  >
                    Control Panel
                  </Link>
                ) : (
                  <SignInButton
                    onClick={handleSignInClick}
                    className="btn-terminal inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base"
                  />
                )}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-[var(--console-border)] py-8">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="rounded border border-[var(--console-border)] bg-[var(--console-dark)] px-2 py-0.5 font-mono text-[var(--text-dim)]">
                    v1.0.0
                  </span>
                  <span>NukeTune is not affiliated with Microsoft. Use at your own risk.</span>
                </div>
                <div className="flex items-center gap-6 text-xs">
                  <Link
                    href="/setup"
                    className="text-[var(--text-muted)] transition-colors hover:text-white"
                  >
                    Documentation
                  </Link>
                  <a
                    href="https://learn.microsoft.com/en-us/graph/api/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] transition-colors hover:text-white"
                  >
                    Microsoft Graph
                  </a>
                  <a
                    href="https://github.com/jorgeasaurus"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] transition-colors hover:text-white"
                    aria-label="GitHub"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  </a>
                  <a
                    href="https://linkedin.com/in/jorgeasaurus"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] transition-colors hover:text-white"
                    aria-label="LinkedIn"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
