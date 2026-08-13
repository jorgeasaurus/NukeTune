/**
 * @param {unknown} value
 * @returns {string}
 */
export function encodeCsvCell(value) {
  const text = String(value);
  const firstContentIndex = text.search(/[^\p{White_Space}\p{Cc}\p{Cf}]/u);
  const leadingCharacters = text.slice(
    0,
    firstContentIndex === -1 ? text.length : firstContentIndex,
  );
  const firstContentCharacter =
    firstContentIndex === -1 ? "" : text.charAt(firstContentIndex);
  const spreadsheetSafeText =
    /[\t\r\n]/.test(leadingCharacters) ||
    (firstContentCharacter.length > 0 && "=+-@".includes(firstContentCharacter))
      ? `'${text}`
      : text;

  return `"${spreadsheetSafeText.replace(/"/g, '""')}"`;
}

/**
 * @param {readonly import("../types/intune").DeletionLogEntry[]} log
 * @returns {string}
 */
export function exportLogToCsv(log) {
  const headers = [
    "Timestamp",
    "Category",
    "Object ID",
    "Object Name",
    "Status",
    "Message",
  ];
  const rows = log.map((entry) => [
    entry.timestamp.toISOString(),
    entry.categoryName,
    entry.objectId,
    entry.objectName,
    entry.status,
    entry.message ?? "",
  ]);

  return [
    headers.join(","),
    ...rows.map((row) => row.map(encodeCsvCell).join(",")),
  ].join("\n");
}
