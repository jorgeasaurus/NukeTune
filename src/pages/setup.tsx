import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

export default function Setup() {
  return (
    <>
      <Head>
        <title>Setup Guide - NukeTune</title>
        <link rel="icon" type="image/png" href="/logo.png" />
      </Head>

      <div className="min-h-screen bg-gray-950 bg-mesh-subtle">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="group flex items-center gap-3 transition-opacity hover:opacity-90"
            >
              <Image
                src="/logo.png"
                alt="NukeTune"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl shadow-lg shadow-red-500/20"
              />
              <span className="text-xl font-bold text-gradient">NukeTune</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="mb-8 text-4xl font-bold tracking-tight text-gradient">
            Getting Started
          </h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300">
              NukeTune is ready to use out of the box. Simply sign in with your
              Microsoft account and start managing your Intune environment.
            </p>

            <h2 className="mt-12 text-2xl font-semibold text-white">
              Step 1: Sign In
            </h2>
            <ol className="mt-4 space-y-3 text-gray-300">
              <li>Click the &quot;Sign in with Microsoft&quot; button</li>
              <li>Select your cloud environment (Commercial, GCC High, DoD, etc.)</li>
              <li>Authenticate with your Microsoft account</li>
              <li>
                If prompted, grant admin consent for the required permissions
              </li>
            </ol>

            <h2 className="mt-12 text-2xl font-semibold text-white">
              Step 2: Select Categories
            </h2>
            <p className="mt-4 text-gray-300">
              On the dashboard, select the Intune object categories you want to
              delete:
            </p>
            <ul className="mt-4 grid gap-2 text-gray-300 sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Managed Devices
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Applications
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Configuration Profiles
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Compliance Policies
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Scripts
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Groups
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Filters
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Autopilot Profiles
              </li>
            </ul>

            <h2 className="mt-12 text-2xl font-semibold text-white">
              Step 3: Preview & Confirm
            </h2>
            <ol className="mt-4 space-y-3 text-gray-300">
              <li>Click &quot;Preview Deletion&quot; to see all objects that will be affected</li>
              <li>Review the list carefully - this shows actual data from your tenant</li>
              <li>Type <code className="rounded bg-gray-800 px-2 py-1">DELETE</code> to confirm</li>
              <li>Monitor the progress as objects are deleted</li>
            </ol>

            <h2 className="mt-12 text-2xl font-semibold text-white">
              Required Permissions
            </h2>
            <p className="mt-4 text-gray-300">
              The signed-in user must have one of the following Intune administrator roles:
            </p>
            <ul className="mt-4 space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Intune Administrator
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Global Administrator
              </li>
            </ul>

            <div className="glass mt-8 overflow-hidden rounded-xl">
              <div className="border-b border-white/10 bg-white/5 px-4 py-3">
                <h3 className="font-medium text-gray-300">API Permissions Used</h3>
              </div>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-white/5 text-gray-400">
                  <tr className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-sm text-blue-400">
                      DeviceManagementManagedDevices.ReadWrite.All
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-sm text-blue-400">
                      DeviceManagementServiceConfig.ReadWrite.All
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-sm text-blue-400">
                      DeviceManagementConfiguration.ReadWrite.All
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-sm text-blue-400">
                      DeviceManagementApps.ReadWrite.All
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-sm text-blue-400">
                      Policy.ReadWrite.ConditionalAccess
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-sm text-blue-400">
                      DeviceManagementRBAC.ReadWrite.All
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="glass glass-warning mt-12 p-6">
              <h3 className="flex items-center gap-2 font-semibold text-yellow-300">
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
              <ul className="mt-3 space-y-2 text-sm text-yellow-100/70">
                <li>
                  Deletions are permanent and cannot be undone
                </li>
                <li>
                  Only use NukeTune with test/dev tenants unless you fully
                  understand the consequences
                </li>
                <li>
                  Always review the preview before confirming deletion
                </li>
                <li>
                  Back up important configurations before proceeding
                </li>
                <li>
                  The deletion log can be exported for audit purposes
                </li>
              </ul>
            </div>

            <div className="glass mt-8 p-6">
              <h3 className="flex items-center gap-2 font-semibold text-blue-300">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Multi-Cloud Support
              </h3>
              <p className="mt-3 text-sm text-gray-400">
                NukeTune supports multiple Microsoft cloud environments:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-gray-400">
                <li>Global (Commercial)</li>
                <li>US Government (GCC High)</li>
                <li>US Government (DoD)</li>
                <li>Germany</li>
                <li>China (21Vianet)</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">
                Select your environment when signing in.
              </p>
            </div>
          </div>

          <div className="mt-12 flex gap-4">
            <Link
              href="/"
              className="glass-button inline-flex items-center gap-2"
            >
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
        </main>
      </div>
    </>
  );
}
