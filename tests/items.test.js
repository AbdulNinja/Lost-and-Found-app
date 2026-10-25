// Tests for items.js.
// fetch() is replaced with a fake so no real server is needed and we can
// check exactly what would be sent.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ITEMS_ENDPOINT,
  validateItem,
  filterItems,
  loadItems,
  reportItem,
  saveItemChanges,
  markRecovered,
  deleteItem,
} from "../js/items.js";

const validData = {
  type: "lost",
  name: "Black backpack",
  category: "Bags",
  location: "Library",
  date: "2026-01-01",
  description: "Has a red keychain",
  contact: "0712 345 678",
};

const sample = [
  { id: 1, type: "lost", name: "Black backpack", category: "Bags", location: "Library", description: "Red keychain", recovered: false, createdAt: "2026-10-01T00:00:00Z" },
  { id: 2, type: "found", name: "Blue bottle", category: "Other", location: "Gym", description: "Steel bottle", recovered: true, createdAt: "2026-10-03T00:00:00Z" },
  { id: 3, type: "found", name: "House keys", category: "Keys", location: "Cafeteria", description: "Three keys on a ring", recovered: false, createdAt: "2026-10-02T00:00:00Z" },
];

function fakeResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("validateItem", () => {
  it("accepts correct data", () => {
    expect(validateItem(validData)).toEqual({});
  });

  it("rejects missing or too-short fields", () => {
    const errors = validateItem({ type: "", name: "a", category: "", location: "", date: "", description: "hi", contact: "" });
    expect(Object.keys(errors).sort()).toEqual(
      ["category", "contact", "date", "description", "location", "name", "type"]
    );
  });

});

describe("filterItems", () => {
  it("returns everything with no filters", () => {
    expect(filterItems(sample)).toHaveLength(3);
  });

  it("filters by category", () => {
    expect(filterItems(sample, { category: "Keys" }).map((i) => i.id)).toEqual([3]);
  });

});

describe("HTTP actions", () => {
  it("loadItems sends GET to /items and sorts newest first", async () => {
    fetch.mockResolvedValue(fakeResponse(sample));
    const result = await loadItems();
    expect(fetch.mock.calls[0][0]).toBe(ITEMS_ENDPOINT);
    expect(fetch.mock.calls[0][1].method).toBeUndefined(); // default method is GET
    expect(result.map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it("reportItem sends POST with a cleaned, unrecovered item", async () => {
    fetch.mockResolvedValue(fakeResponse({ id: 9 }));
    await reportItem({ ...validData, name: "  Black backpack  " });
    const [url, options] = fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(url).toBe(ITEMS_ENDPOINT);
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(body.name).toBe("Black backpack");
    expect(body.recovered).toBe(false);
    expect(body.createdAt).toBeTruthy();
  });

  it("saveItemChanges sends PUT with the whole item, keeping id and status", async () => {
    fetch.mockResolvedValue(fakeResponse({}));
    const existing = { id: 5, recovered: true, createdAt: "2026-10-01T00:00:00Z", ...validData };
    await saveItemChanges(existing, { ...validData, name: "New name" });
    const [url, options] = fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(url).toBe(`${ITEMS_ENDPOINT}/5`);
    expect(options.method).toBe("PUT");
    expect(body.name).toBe("New name");
    expect(body.recovered).toBe(true);
    expect(body.createdAt).toBe("2026-10-01T00:00:00Z");
  });

  it("markRecovered sends PATCH with only the recovered field", async () => {
    fetch.mockResolvedValue(fakeResponse({}));
    await markRecovered("4");
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(`${ITEMS_ENDPOINT}/4`);
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ recovered: true });
  });

});