/**
 * Helper to safely parse JSON fields stored as strings in SQLite.
 * Falls through gracefully if the value is already an object.
 */
export function parseJson<T = any>(value: string | T | null | undefined): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

/**
 * Helper to stringify JSON for storage in SQLite.
 * If already a string, returns as-is.
 */
export function stringifyJson(value: any): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
