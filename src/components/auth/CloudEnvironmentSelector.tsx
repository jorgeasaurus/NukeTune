interface CloudEnvironmentSelectorProps {
  open: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export function CloudEnvironmentSelector({
  open,
  onContinue,
  onCancel,
}: CloudEnvironmentSelectorProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="console-modal relative z-10 mx-4 w-full max-w-lg p-6">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <svg
              className="h-5 w-5 text-[var(--terminal-green)]"
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
            <span className="text-xs font-medium tracking-wider text-[var(--text-dim)] uppercase">
              Environment Selection
            </span>
          </div>
          <h2 className="font-display text-xl font-semibold text-white">
            Select Cloud Environment
          </h2>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            NukeTune supports Microsoft Global Commercial tenants only.
          </p>
        </div>

        <div className="rounded-lg border border-[var(--terminal-green)]/50 bg-[var(--terminal-green)]/5 p-4">
          <label className="flex items-start gap-4">
            <input
              type="radio"
              name="cloudEnvironment"
              value="global"
              checked
              readOnly
              className="checkbox-terminal mt-0.5"
            />
            <div className="flex-1">
              <span className="font-display text-sm font-medium text-white">
                Global (Commercial)
              </span>
              <p className="mt-0.5 text-xs text-[var(--text-dim)]">
                Microsoft 365 commercial cloud for worldwide customers
              </p>
            </div>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-terminal text-xs">
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="btn-success flex items-center gap-2 text-xs"
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
