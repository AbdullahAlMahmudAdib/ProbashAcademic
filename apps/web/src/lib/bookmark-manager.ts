/**
 * Pure bookmark state manager — no side effects, no API calls.
 * Takes an initial array of bookmarked scholarship IDs and returns
 * functions that compute the next state.
 */
export function createBookmarkManager(initialIds: string[]) {
  const ids = new Set(initialIds);

  return {
    add(id: string): string[] {
      ids.add(id);
      return Array.from(ids);
    },

    remove(id: string): string[] {
      ids.delete(id);
      return Array.from(ids);
    },

    toggle(id: string): string[] {
      if (ids.has(id)) {
        ids.delete(id);
      } else {
        ids.add(id);
      }
      return Array.from(ids);
    },

    has(id: string): boolean {
      return ids.has(id);
    },

    count(): number {
      return ids.size;
    },

    getIds(): string[] {
      return Array.from(ids);
    },
  };
}
