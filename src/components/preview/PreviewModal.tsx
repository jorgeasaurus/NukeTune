import { useState, useEffect, useId } from "react";
import { useNukeTuneStore, useSelectedCategories, useTotalObjectCount } from "~/store";
import { useIntune } from "~/hooks/useIntune";
import { useModalA11y } from "~/hooks/useModalA11y";
import { useTenantDisplay } from "~/hooks/useTenantIdentity";
import { isConfirmationMatch } from "~/lib/graph/tenantIdentity";
import { PreviewTable } from "./PreviewTable";

export function PreviewModal() {
  const previewOpen = useNukeTuneStore((state) => state.previewOpen);
  const deletionPhase = useNukeTuneStore((state) => state.deletionPhase);
  const closePreview = useNukeTuneStore((state) => state.closePreview);
  const setDeletionPhase = useNukeTuneStore((state) => state.setDeletionPhase);
  const toggleCategory = useNukeTuneStore((state) => state.toggleCategory);
  const selectedCategories = useSelectedCategories();
  const totalCount = useTotalObjectCount();
  const { loadSelectedCategories, loadCategoryObjects, startDeletion, exportInventory } =
    useIntune();
  const tenant = useTenantDisplay();

  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [dryRun, setDryRun] = useState(false);

  const titleId = useId();
  const confirmInputId = useId();
  const confirmHintId = useId();
  const dryRunId = useId();

  // Once deletion starts, DeletionProgress takes over; don't keep this modal
  // (and its confirm input) mounted underneath it.
  const deletionStarted =
    deletionPhase === "confirming" ||
    deletionPhase === "deleting" ||
    deletionPhase === "complete";
  const isOpen = previewOpen && !deletionStarted;

  const dialogRef = useModalA11y<HTMLDivElement>(isOpen, closePreview);

  const { phrase: confirmPhrase, source: confirmSource } = tenant.confirmation;
  const tenantPending = tenant.status === "loading";
  const isConfirmed = !tenantPending && isConfirmationMatch(confirmText, confirmPhrase);
  const anyLoading = selectedCategories.some((cat) => cat.loading);
  // `isLoading` is the initial load of every selected category and replaces
  // the content with a spinner. A single category being retried (`anyLoading`)
  // only blocks the delete action, so the rest of the preview stays visible.
  const busy = isLoading || anyLoading;
  const failedCategories = selectedCategories.filter((cat) => cat.error);
  const hasFailures = failedCategories.length > 0;

  useEffect(() => {
    if (previewOpen && !hasLoaded) {
      setIsLoading(true);
      loadSelectedCategories()
        .then(() => {
          setHasLoaded(true);
        })
        .catch((err: unknown) => {
          console.error("Failed to load categories:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [previewOpen, hasLoaded, loadSelectedCategories]);

  useEffect(() => {
    if (!previewOpen) {
      setConfirmText("");
      setHasLoaded(false);
      setDryRun(false);
    }
  }, [previewOpen]);

  if (!isOpen) return null;

  // A dry run makes no Graph writes, so it does not need the typed confirmation.
  const loadedObjectCount = selectedCategories.reduce((sum, cat) => sum + cat.objects.length, 0);
  const handleExportInventory = (format: "json" | "csv") => {
    exportInventory(format, {
      id: tenant.tenantId,
      name: tenant.tenantName,
      domain: tenant.domain,
    });
  };

  const canDelete = (dryRun || isConfirmed) && !busy && !hasFailures && totalCount > 0;

  const handleStartDeletion = () => {
    if (!canDelete) return;
    setDeletionPhase("confirming");
    void startDeletion({ dryRun });
  };

  const handleClose = () => {
    closePreview();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="console-modal console-modal-danger flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col outline-none max-sm:overflow-y-auto sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="z-20 flex items-center justify-between border-b border-[var(--console-border)] bg-[var(--console-dark)] px-4 py-3 max-sm:sticky max-sm:top-0 sm:p-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="status-dot status-dot-warning" />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                Preview Mode
              </span>
            </div>
            <h2 id={titleId} className="font-display text-xl font-bold text-white sm:text-2xl">
              Deletion Preview
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="btn-terminal rounded-lg p-2"
            aria-label="Close"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:min-h-0 sm:flex-1 sm:overflow-auto sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--console-border)] border-t-[var(--terminal-green)]" />
                <div
                  className="absolute inset-2 animate-spin rounded-full border-2 border-[var(--console-border)] border-t-[var(--terminal-green)]"
                  style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                />
              </div>
              <p className="mt-4 text-sm text-[var(--text-dim)]" role="status">
                <span className="text-[var(--terminal-green)]">$</span> Loading objects from Intune...
              </p>
            </div>
          ) : (
            <>
              {anyLoading && (
                <p className="mb-4 text-xs text-[var(--text-dim)]" role="status">
                  <span className="text-[var(--terminal-green)]">$</span> Reloading{" "}
                  {selectedCategories.filter((cat) => cat.loading).length} of{" "}
                  {selectedCategories.length} categories...
                </p>
              )}
              {hasFailures && (
                <div className="banner-warning mb-4 p-4" role="alert">
                  <p className="text-sm font-semibold text-[var(--warning-amber)]">
                    {failedCategories.length} selected{" "}
                    {failedCategories.length === 1 ? "category" : "categories"} could not be
                    loaded. Their object counts are unknown, not zero. Retry or exclude
                    them to continue.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {failedCategories.map((cat) => (
                      <li
                        key={cat.category.id}
                        className="flex flex-col gap-2 rounded-md border border-[var(--console-border)] bg-black/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">
                            {cat.category.name}
                          </div>
                          <div className="break-words font-mono text-xs text-[var(--text-dim)]">
                            {cat.error}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => void loadCategoryObjects(cat.category)}
                            disabled={cat.loading}
                            className="btn-warning text-xs"
                          >
                            {cat.loading ? "Retrying..." : "Retry"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCategory(cat.category.id)}
                            className="btn-terminal text-xs"
                          >
                            Exclude
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="console-panel mb-4 flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[var(--text-dim)]">
                  <span className="font-semibold uppercase tracking-wider text-white">
                    Export inventory
                  </span>{" "}
                  — a record of the list properties of the {loadedObjectCount} loaded objects.
                  Not a restorable backup: settings catalog settings, assignments, app content
                  and script bodies are not included.
                </p>
                <div className="flex flex-shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportInventory("json")}
                    aria-label="Export inventory as JSON"
                    disabled={loadedObjectCount === 0}
                    className="btn-terminal flex-1 text-xs disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportInventory("csv")}
                    aria-label="Export inventory as CSV"
                    disabled={loadedObjectCount === 0}
                    className="btn-terminal flex-1 text-xs disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                  >
                    CSV
                  </button>
                </div>
              </div>
              <PreviewTable categories={selectedCategories} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--console-border)] p-4 sm:p-6">
          <div className={`${dryRun ? "banner-warning" : "banner-danger"} mb-3 p-3`}>
            <p
              className={`text-xs sm:text-sm ${dryRun ? "text-[var(--warning-amber)]" : "text-[var(--critical-red)]"}`}
            >
              {dryRun ? (
                <>
                  <strong>Dry run:</strong> nothing will be deleted. You are about to
                  simulate deleting{" "}
                </>
              ) : (
                <>
                  <strong>Warning:</strong> This action is irreversible. You are about
                  to delete{" "}
                </>
              )}
              <strong className="font-mono">{busy ? "…" : totalCount}</strong> objects across{" "}
              <strong className="font-mono">{selectedCategories.length}</strong> categories in{" "}
              <strong title={tenant.tenantId ? `Tenant ID: ${tenant.tenantId}` : undefined}>
                {tenantPending ? "(resolving tenant…)" : tenant.label}
              </strong>
              .
              {hasFailures && (
                <>
                  {" "}
                  <strong>{failedCategories.length}</strong> of those categories failed
                  to load.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex-1">
              <label
                htmlFor={confirmInputId}
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]"
              >
                Type{" "}
                <span className="font-mono normal-case text-[var(--danger-red)]">
                  {tenantPending ? "…" : confirmPhrase}
                </span>{" "}
                to confirm
              </label>
              <input
                id={confirmInputId}
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={tenantPending ? "Resolving tenant..." : `Type ${confirmPhrase} to confirm`}
                disabled={tenantPending}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-describedby={confirmSource === "tenant" ? undefined : confirmHintId}
                className="input-terminal input-danger"
              />
              {dryRun && (
                <p className="mt-1 text-xs text-[var(--text-dim)]">Not required for a dry run.</p>
              )}
              {confirmSource !== "tenant" && !tenantPending && (
                <p id={confirmHintId} className="mt-1 text-xs text-[var(--text-muted)]">
                  {confirmSource === "account"
                    ? "Tenant domain unavailable; confirm with your signed-in account's domain."
                    : "Tenant domain unavailable; confirm with the generic phrase."}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <label
                htmlFor={dryRunId}
                className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-dim)]"
              >
                <input
                  id={dryRunId}
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="checkbox-terminal"
                />
                <span>
                  <span className="font-semibold uppercase tracking-wider text-white">Dry run</span>{" "}
                  — simulate, delete nothing
                </span>
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={handleClose} className="btn-terminal flex-1 sm:flex-none">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartDeletion}
                  disabled={!canDelete}
                  className={`${dryRun ? "btn-warning" : "btn-danger"} flex-[2] sm:flex-none`}
                >
                  {busy
                    ? "Loading..."
                    : hasFailures
                      ? `${failedCategories.length} Failed to Load`
                      : dryRun
                        ? `Simulate ${totalCount} Objects`
                        : `Delete ${totalCount} Objects`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
