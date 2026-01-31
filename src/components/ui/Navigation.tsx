import Link from "next/link";
import Image from "next/image";
import { useIsAuthenticated } from "@azure/msal-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { SignInButton, CloudEnvironmentSelector } from "~/components/auth";
import { signIn } from "~/lib/auth/authUtils";
import type { CloudEnvironment } from "~/types/cloud";

const navLinkClass =
  "rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)] transition-colors hover:bg-white/5 hover:text-white";

export function Navigation() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const [showCloudSelector, setShowCloudSelector] = useState(false);

  async function handleCloudSelect(environment: CloudEnvironment) {
    setShowCloudSelector(false);
    try {
      await signIn(environment);
      void router.push("/dashboard");
    } catch (error) {
      console.error("Sign in error:", error);
    }
  }

  return (
    <>
      <div className="fixed left-1/2 top-4 z-50 w-full max-w-4xl -translate-x-1/2 px-4">
        <nav className="nav-console flex items-center justify-between rounded-xl px-4 py-3 sm:px-6">
          {/* Logo and Brand */}
          <Link
            href="/"
            className="group flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo.png"
              alt="NukeTune"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg"
            />
            <div className="hidden sm:block">
              <span className="font-display text-lg font-bold tracking-tight text-white">
                NUKE
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-[var(--danger-red)]">
                TUNE
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-1 md:flex">
            <Link href="/#features" className={navLinkClass}>
              Features
            </Link>
            <Link href="/#how-it-works" className={navLinkClass}>
              Process
            </Link>
            <Link href="/setup" className={navLinkClass}>
              Setup
            </Link>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="btn-danger rounded-lg px-4 py-2 text-xs"
              >
                Control Panel
              </Link>
            ) : (
              <SignInButton
                onClick={() => setShowCloudSelector(true)}
                className="btn-terminal flex items-center gap-2 rounded-lg px-4 py-2 text-xs"
              />
            )}
          </div>
        </nav>
      </div>

      <CloudEnvironmentSelector
        open={showCloudSelector}
        onSelect={handleCloudSelect}
        onCancel={() => setShowCloudSelector(false)}
      />
    </>
  );
}
