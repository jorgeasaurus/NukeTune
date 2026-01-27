import { useState } from "react";
import type { CloudEnvironment } from "~/types/cloud";

interface CloudEnvironmentSelectorProps {
  open: boolean;
  onSelect: (environment: CloudEnvironment) => void;
  onCancel: () => void;
}

const CLOUD_OPTIONS: {
  value: CloudEnvironment;
  label: string;
  description: string;
}[] = [
  {
    value: "global",
    label: "Global (Commercial)",
    description: "Microsoft 365 commercial cloud for worldwide customers",
  },
  {
    value: "usgov",
    label: "US Government (GCC High)",
    description: "Government Community Cloud High for US federal agencies",
  },
  {
    value: "usgovdod",
    label: "US Government (DoD)",
    description: "Department of Defense cloud environment",
  },
  {
    value: "germany",
    label: "Germany",
    description: "Microsoft Cloud Germany (data residency in Germany)",
  },
  {
    value: "china",
    label: "China (21Vianet)",
    description: "Microsoft Azure operated by 21Vianet in China",
  },
];

export function CloudEnvironmentSelector({
  open,
  onSelect,
  onCancel,
}: CloudEnvironmentSelectorProps) {
  const [selected, setSelected] = useState<CloudEnvironment>("global");

  if (!open) return null;

  const handleContinue = () => {
    onSelect(selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="glass-modal relative z-10 w-full max-w-lg mx-4 p-6">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <svg
              className="h-5 w-5 text-gray-400"
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
            Select Cloud Environment
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Choose the Microsoft cloud environment for your tenant.
          </p>
        </div>

        <div className="space-y-3">
          {CLOUD_OPTIONS.map((env) => (
            <label
              key={env.value}
              className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all ${
                selected === env.value
                  ? "border-red-500/50 bg-red-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
            >
              <input
                type="radio"
                name="cloudEnvironment"
                value={env.value}
                checked={selected === env.value}
                onChange={() => setSelected(env.value)}
                className="mt-1 h-4 w-4 accent-red-500"
              />
              <div className="flex-1">
                <span className="font-medium text-white">{env.label}</span>
                <p className="mt-0.5 text-sm text-gray-400">{env.description}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="glass-button px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className="btn-shine flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Continue to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
