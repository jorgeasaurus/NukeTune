import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useIsAuthenticated } from "@azure/msal-react";
import { useEffect, useRef, useState } from "react";
import { SignInButton, CloudEnvironmentSelector } from "~/components/auth";
import { GradientBackground } from "~/components/ui/GradientBackground";
import { Navigation } from "~/components/ui/Navigation";
import { signIn } from "~/lib/auth/authUtils";
import type { CloudEnvironment } from "~/types/cloud";

export default function Home() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [showCloudSelector, setShowCloudSelector] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      void router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

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
        <link rel="icon" type="image/png" href="/logo.png" />
      </Head>

      <div className="relative min-h-screen bg-gray-950">
        <GradientBackground />

        <div className="relative z-10">
          <Navigation />

          {/* Hero Section */}
          <section className="container mx-auto px-4 pb-16 pt-32">
            <div className="mx-auto max-w-5xl space-y-6 text-center">
              {/* Title */}
              <h1 className="text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                Reset Your Intune Tenant.{" "}
                <span className="gradient-text-animated">Completely.</span>
              </h1>

              <p className="mx-auto max-w-3xl text-xl text-gray-400 sm:text-2xl">
                Delete devices, apps, policies, and configurations from your
                Microsoft Intune environment with a single click.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
                <SignInButton
                  onClick={handleSignInClick}
                  className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl"
                />
                <Link
                  href="/setup"
                  className="glass-button inline-flex items-center justify-center gap-2 rounded-xl text-lg"
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  Setup Guide
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
              <div className="glass glass-warning p-6 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-yellow-500/20 p-2">
                    <svg
                      className="h-6 w-6 text-yellow-400"
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
                    <h2 className="mb-1 font-semibold text-yellow-300">
                      Destructive Operations
                    </h2>
                    <p className="text-sm leading-relaxed text-yellow-100/70">
                      This tool performs irreversible deletions. It is intended
                      for test/dev environments or when you need to completely
                      reset your Intune tenant. Always preview what will be
                      deleted before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="container mx-auto scroll-mt-16 px-4 py-16">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                  Features
                </h2>
                <p className="text-lg text-gray-400">
                  Everything you need to clean up your Intune environment
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Feature 1 */}
                <div className="card-interactive group p-6">
                  <svg
                    className="icon-hover mb-4 h-10 w-10 text-red-400"
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
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    Safe Preview Mode
                  </h3>
                  <p className="text-sm text-gray-400">
                    Preview everything that will be deleted before executing.
                    Review items, counts, and categories before committing.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="card-interactive group p-6">
                  <svg
                    className="icon-hover mb-4 h-10 w-10 text-orange-400"
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
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    Selective Deletion
                  </h3>
                  <p className="text-sm text-gray-400">
                    Choose exactly what to delete: devices, apps, configuration
                    profiles, compliance policies, scripts, and more.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="card-interactive group p-6">
                  <svg
                    className="icon-hover mb-4 h-10 w-10 text-yellow-400"
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
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    Batch Processing
                  </h3>
                  <p className="text-sm text-gray-400">
                    Delete hundreds of items efficiently with batch operations.
                    Progress tracking and detailed logs for every action.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="card-interactive group p-6">
                  <svg
                    className="icon-hover mb-4 h-10 w-10 text-blue-400"
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
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    Detailed Logging
                  </h3>
                  <p className="text-sm text-gray-400">
                    Complete audit trail of all deletions. Track successes,
                    failures, and skipped items with timestamps.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="card-interactive group p-6">
                  <svg
                    className="icon-hover mb-4 h-10 w-10 text-purple-400"
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
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    Multi-Cloud Support
                  </h3>
                  <p className="text-sm text-gray-400">
                    Works with Global, US Government (GCC High & DoD), and
                    other sovereign cloud environments.
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="card-interactive group p-6">
                  <svg
                    className="icon-hover mb-4 h-10 w-10 text-green-400"
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
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    Secure Authentication
                  </h3>
                  <p className="text-sm text-gray-400">
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
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                  How It Works
                </h2>
                <p className="text-lg text-gray-400">
                  Three simple steps to reset your environment
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                {/* Step 1 */}
                <div className="card-interactive group p-6">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                        <svg
                          className="icon-hover h-8 w-8 text-blue-400"
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
                      <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-sm font-bold text-white">
                        1
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Sign In</h3>
                    <p className="text-sm text-gray-400">
                      Authenticate with your Microsoft account and connect to
                      your Intune tenant
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="card-interactive group p-6">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
                        <svg
                          className="icon-hover h-8 w-8 text-orange-400"
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
                      <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-sm font-bold text-white">
                        2
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Select & Preview
                    </h3>
                    <p className="text-sm text-gray-400">
                      Choose categories to delete and preview all items before
                      committing to the operation
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="card-interactive group p-6">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                        <svg
                          className="icon-hover h-8 w-8 text-red-400"
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
                      <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-sm font-bold text-white">
                        3
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Execute</h3>
                    <p className="text-sm text-gray-400">
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
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                  What Can Be Deleted
                </h2>
                <p className="text-lg text-gray-400">
                  Clean up any combination of Intune objects
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: "Devices", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                  { name: "Applications", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
                  { name: "Config Profiles", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
                  { name: "Compliance Policies", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
                  { name: "Scripts", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
                  { name: "Groups", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
                  { name: "Filters", icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" },
                  { name: "Autopilot", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="card-interactive group flex items-center gap-3 p-4"
                  >
                    <svg
                      className="icon-hover h-6 w-6 shrink-0 text-red-400"
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
                    <span className="font-medium text-gray-200">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-4xl">
              <div className="glass glass-danger p-8 text-center">
                <h2 className="mb-4 text-3xl font-bold text-white">
                  Ready to Reset Your Intune Tenant?
                </h2>
                <p className="mb-6 text-lg text-gray-300">
                  Sign in with your Microsoft account to get started
                </p>
                <SignInButton
                  onClick={handleSignInClick}
                  className="btn-shine inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl"
                />
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/5 py-8">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="text-sm text-gray-500">
                  NukeTune is not affiliated with Microsoft. Use at your own risk.
                </div>
                <div className="flex gap-6 text-sm">
                  <Link
                    href="/setup"
                    className="text-gray-500 transition-colors hover:text-gray-300"
                  >
                    Setup Guide
                  </Link>
                  <a
                    href="https://learn.microsoft.com/en-us/graph/api/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 transition-colors hover:text-gray-300"
                  >
                    Microsoft Graph
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
