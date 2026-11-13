import Link from "next/link";
import Image from "next/image";
import { useIsAuthenticated } from "@azure/msal-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { SignInButton, CloudEnvironmentSelector } from "~/components/auth";
import { signIn } from "~/lib/auth/authUtils";
import { SignInErrorAlert, getSignInErrorMessage } from "./SignInErrorAlert";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "Process" },
  { href: "/#faq", label: "FAQ" },
  { href: "/setup", label: "Setup" },
];

const navLinkClass =
  "rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)] transition-colors hover:bg-white/5 hover:text-white";

export function Navigation() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const [showCloudSelector, setShowCloudSelector] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  async function handleSignIn() {
    setShowCloudSelector(false);
    try {
      await signIn();
      void router.push("/dashboard");
    } catch (error) {
      console.error("Sign in error:", error);
      setSignInError(getSignInErrorMessage(error));
    }
  }

  return (
    <>
      <div className="fixed left-1/2 top-4 z-50 w-full max-w-4xl -translate-x-1/2 px-4">
        <nav
          aria-label="Main"
          className="nav-console flex flex-wrap items-center justify-between rounded-xl px-4 py-3 sm:px-6">
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
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass}>
                {link.label}
              </Link>
            ))}
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
                onClick={() => {
                  setSignInError(null);
                  setShowCloudSelector(true);
                }}
                className="btn-terminal flex items-center gap-2 rounded-lg px-4 py-2 text-xs"
              />
            )}
          </div>

          {/* Below md the links get their own row instead of disappearing. */}
          <div className="mt-2 flex w-full justify-between border-t border-[var(--console-border)] pt-2 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-2.5 text-[11px] font-medium tracking-wider text-[var(--text-dim)] uppercase transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        {signInError && (
          // Opaque backing so the alert stays readable over page content.
          <div className="nav-console mt-2 rounded-lg">
            <SignInErrorAlert
              message={signInError}
              onDismiss={() => setSignInError(null)}
            />
          </div>
        )}
      </div>

      <CloudEnvironmentSelector
        open={showCloudSelector}
        onContinue={() => void handleSignIn()}
        onCancel={() => setShowCloudSelector(false)}
      />
    </>
  );
}
