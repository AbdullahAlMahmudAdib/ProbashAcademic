import { describe, it, expect } from "vitest";
import { createBookmarkManager } from "@/lib/bookmark-manager";

describe("createBookmarkManager", () => {
  describe("add", () => {
    it("adds a new scholarship id to the set", () => {
      const bm = createBookmarkManager(["abc-1"]);
      const result = bm.add("abc-2");
      expect(result).toEqual(["abc-1", "abc-2"]);
      expect(result).toHaveLength(2);
    });

    it("returns the same array if id is already bookmarked", () => {
      const bm = createBookmarkManager(["abc-1", "abc-2"]);
      const result = bm.add("abc-1");
      expect(result).toEqual(["abc-1", "abc-2"]);
      expect(result).toHaveLength(2);
    });

    it("does not mutate the original array", () => {
      const initial = ["abc-1"];
      const bm = createBookmarkManager(initial);
      bm.add("abc-2");
      expect(initial).toEqual(["abc-1"]);
    });
  });

  describe("remove", () => {
    it("removes an existing scholarship id", () => {
      const bm = createBookmarkManager(["abc-1", "abc-2"]);
      const result = bm.remove("abc-1");
      expect(result).toEqual(["abc-2"]);
      expect(result).toHaveLength(1);
    });

    it("returns the same array if id is not bookmarked", () => {
      const bm = createBookmarkManager(["abc-1"]);
      const result = bm.remove("abc-2");
      expect(result).toEqual(["abc-1"]);
      expect(result).toHaveLength(1);
    });

    it("returns empty array when removing last bookmark", () => {
      const bm = createBookmarkManager(["abc-1"]);
      const result = bm.remove("abc-1");
      expect(result).toEqual([]);
    });
  });

  describe("toggle", () => {
    it("adds when id is not bookmarked", () => {
      const bm = createBookmarkManager(["abc-1"]);
      const result = bm.toggle("abc-2");
      expect(result).toEqual(["abc-1", "abc-2"]);
    });

    it("removes when id is already bookmarked", () => {
      const bm = createBookmarkManager(["abc-1", "abc-2"]);
      const result = bm.toggle("abc-1");
      expect(result).toEqual(["abc-2"]);
    });
  });

  describe("has", () => {
    it("returns true for a bookmarked id", () => {
      const bm = createBookmarkManager(["abc-1"]);
      expect(bm.has("abc-1")).toBe(true);
    });

    it("returns false for a non-bookmarked id", () => {
      const bm = createBookmarkManager(["abc-1"]);
      expect(bm.has("abc-2")).toBe(false);
    });

    it("returns false for an empty manager", () => {
      const bm = createBookmarkManager([]);
      expect(bm.has("abc-1")).toBe(false);
    });
  });

  describe("count", () => {
    it("returns the number of bookmarks", () => {
      const bm = createBookmarkManager(["abc-1", "abc-2", "abc-3"]);
      expect(bm.count()).toBe(3);
    });

    it("returns 0 for no bookmarks", () => {
      const bm = createBookmarkManager([]);
      expect(bm.count()).toBe(0);
    });
  });

  describe("getIds", () => {
    it("returns all bookmarked ids", () => {
      const bm = createBookmarkManager(["abc-1", "abc-2"]);
      expect(bm.getIds()).toEqual(["abc-1", "abc-2"]);
    });
  });
});
