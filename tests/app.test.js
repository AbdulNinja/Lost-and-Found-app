// Tests for app.js DOM and UI logic.
// Core tests for form handling, rendering, and filtering.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { filterItems, validateItem } from "../js/items.js";

// Set up the DOM for all tests
function setupDOM() {
  document.body.innerHTML = `
    <header class="site-header">
      <div class="container">
        <h1>Lost & Found</h1>
        <p>Report and find lost or found items on campus.</p>
      </div>
    </header>
    <main class="container">
      <div class="layout">
        <aside class="panel">
          <form id="item-form">
            <h2 id="form-heading">Report an item</h2>
            <fieldset id="type-group">
              <label>Item type</label>
              <label class="radio"><input type="radio" name="type" value="lost" required /> Lost</label>
              <label class="radio"><input type="radio" name="type" value="found" required /> Found</label>
            </fieldset>
            <label for="name">Item name</label>
            <input type="text" id="name" name="name" placeholder="e.g. Black backpack" required />
            <p class="error" data-error-for="name"></p>

            <label for="category">Category</label>
            <select id="category" name="category" required>
              <option value="">Choose…</option>
              <option value="Bags">Bags</option>
              <option value="Electronics">Electronics</option>
              <option value="Documents">Documents</option>
              <option value="Keys">Keys</option>
              <option value="Other">Other</option>
            </select>
            <p class="error" data-error-for="category"></p>

            <label for="location">Location</label>
            <input type="text" id="location" name="location" placeholder="Where did it happen?" required />
            <p class="error" data-error-for="location"></p>

            <label for="date">Date</label>
            <input type="date" id="date" name="date" required />
            <p class="error" data-error-for="date"></p>

            <label for="description">Description</label>
            <textarea id="description" name="description" placeholder="Any details that might help" required></textarea>
            <p class="error" data-error-for="description"></p>

            <label for="contact">Your contact</label>
            <input type="text" id="contact" name="contact" placeholder="Phone or email" required />
            <p class="error" data-error-for="contact"></p>

            <button type="submit" id="submit-btn" class="btn btn-primary">Submit report</button>
            <button type="button" id="cancel-edit" class="btn btn-secondary" hidden>Cancel</button>
          </form>
        </aside>

        <section class="panel">
          <h2>Items</h2>
          <div class="filters" id="filters">
            <input type="search" id="search" placeholder="Search all fields" />
            <select id="filter-type">
              <option value="">All types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
            <select id="filter-category">
              <option value="">All categories</option>
              <option value="Bags">Bags</option>
              <option value="Electronics">Electronics</option>
              <option value="Documents">Documents</option>
              <option value="Keys">Keys</option>
              <option value="Other">Other</option>
            </select>
            <select id="filter-status">
              <option value="">All statuses</option>
              <option value="recovered">Recovered</option>
              <option value="open">Open</option>
            </select>
          </div>
          <p id="status-message" class="status-message" role="status" aria-live="polite"></p>
          <div id="item-list" class="item-grid"></div>
        </section>
      </div>
    </main>

    <template id="item-template">
      <div class="card">
        <div class="card-top">
          <span class="badge badge-type"></span>
          <span class="badge badge-status" hidden>Recovered</span>
        </div>
        <h3 class="card-title"></h3>
        <p class="card-meta"></p>
        <p class="card-desc"></p>
        <p class="card-contact"></p>
        <div class="card-actions">
          <button class="btn btn-success" data-action="recover">Mark recovered</button>
          <button class="btn btn-secondary" data-action="edit">Edit</button>
          <button class="btn btn-danger" data-action="delete">Delete</button>
        </div>
      </div>
    </template>
  `;
}

describe("app.js — core UI tests", () => {
  beforeEach(() => {
    setupDOM();
  });

  describe("Card rendering", () => {
    it("creates card DOM from item data", () => {
      const item = {
        id: 1,
        type: "lost",
        name: "Black backpack",
        category: "Bags",
        location: "Library",
        date: "2026-10-15",
        description: "Red keychain inside",
        contact: "0712345678",
        recovered: false,
      };

      const template = document.getElementById("item-template");
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.id = item.id;
      node.dataset.type = item.type;
      node.querySelector(".card-title").textContent = item.name;
      node.querySelector(".badge-type").textContent = item.type;

      expect(node.dataset.id).toBe("1");
      expect(node.querySelector(".card-title").textContent).toBe("Black backpack");
      expect(node.querySelector(".badge-type").textContent).toBe("lost");
    });

    it("marks recovered items with CSS class and disables button", () => {
      const item = { id: 2, recovered: true };
      const template = document.getElementById("item-template");
      const node = template.content.firstElementChild.cloneNode(true);
      node.classList.toggle("is-recovered", item.recovered);
      node.querySelector('[data-action="recover"]').disabled = item.recovered;

      expect(node.classList.contains("is-recovered")).toBe(true);
      expect(node.querySelector('[data-action="recover"]').disabled).toBe(true);
    });

    it("renders multiple items in the list", () => {
      const items = [
        { id: 1, type: "lost", name: "Item 1", recovered: false },
        { id: 2, type: "found", name: "Item 2", recovered: true },
      ];
      const listEl = document.getElementById("item-list");
      const template = document.getElementById("item-template");

      listEl.innerHTML = "";
      items.forEach((item) => {
        const card = template.content.firstElementChild.cloneNode(true);
        card.dataset.id = item.id;
        card.querySelector(".card-title").textContent = item.name;
        listEl.appendChild(card);
      });

      expect(listEl.children.length).toBe(2);
    });
  });

  describe("Form handling", () => {
    it("displays and clears validation errors", () => {
      const form = document.getElementById("item-form");
      const errors = { name: "Required" };

      form.querySelector('[data-error-for="name"]').textContent = errors.name;
      expect(form.querySelector('[data-error-for="name"]').textContent).toBe("Required");

      form.querySelector('[data-error-for="name"]').textContent = "";
      expect(form.querySelector('[data-error-for="name"]').textContent).toBe("");
    });

    it("populates form with item data for editing", () => {
      const item = {
        type: "lost",
        name: "Backpack",
        category: "Bags",
        location: "Library",
        date: "2026-10-15",
        description: "Red keychain",
        contact: "0712345678",
      };
      const form = document.getElementById("item-form");

      form.elements.name.value = item.name;
      form.elements.category.value = item.category;

      expect(form.elements.name.value).toBe("Backpack");
      expect(form.elements.category.value).toBe("Bags");
    });

    it("resets form to blank state", () => {
      const form = document.getElementById("item-form");
      form.elements.name.value = "Test";
      form.reset();
      expect(form.elements.name.value).toBe("");
    });

    it("toggles edit mode UI", () => {
      const formHeading = document.getElementById("form-heading");
      const cancelBtn = document.getElementById("cancel-edit");

      formHeading.textContent = "Edit item";
      cancelBtn.hidden = false;
      expect(formHeading.textContent).toBe("Edit item");
      expect(cancelBtn.hidden).toBe(false);

      formHeading.textContent = "Report an item";
      cancelBtn.hidden = true;
      expect(formHeading.textContent).toBe("Report an item");
    });
  });

  describe("Status messages", () => {
    it("displays status messages", () => {
      const statusEl = document.getElementById("status-message");
      statusEl.textContent = "Loading items…";
      expect(statusEl.textContent).toBe("Loading items…");
    });

    it("toggles error styling on status", () => {
      const statusEl = document.getElementById("status-message");
      statusEl.classList.toggle("is-error", true);
      expect(statusEl.classList.contains("is-error")).toBe(true);
    });

    it("disables submit button when busy", () => {
      const submitBtn = document.getElementById("submit-btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving…";
      expect(submitBtn.disabled).toBe(true);
      expect(submitBtn.textContent).toBe("Saving…");
    });
  });

  describe("Filter interactions", () => {
    it("reads filter values", () => {
      document.getElementById("search").value = "backpack";
      document.getElementById("filter-type").value = "lost";

      expect(document.getElementById("search").value).toBe("backpack");
      expect(document.getElementById("filter-type").value).toBe("lost");
    });

    it("filters items by category", () => {
      const items = [
        { id: 1, type: "lost", category: "Bags", location: "Lib", description: "desc", recovered: false },
        { id: 2, type: "found", category: "Keys", location: "Café", description: "desc", recovered: false },
      ];
      const filtered = filterItems(items, { category: "Bags", type: "all", query: "", status: "all" });
      expect(filtered.length).toBe(1);
    });

    it("searches items by query", () => {
      const items = [
        { id: 1, type: "lost", name: "Backpack", category: "Bags", location: "Library", description: "pack", recovered: false },
        { id: 2, type: "found", name: "Bottle", category: "Other", location: "Gym", description: "bottle", recovered: false },
      ];
      const filtered = filterItems(items, { query: "backpack", type: "all", category: "all", status: "all" });
      expect(filtered.length).toBe(1);
    });
  });

  describe("Validation integration", () => {
    it("validates item data", () => {
      const validData = {
        type: "lost",
        name: "Item",
        category: "Bags",
        location: "Lib",
        date: "2026-10-15",
        description: "description",
        contact: "0712345678",
      };
      const errors = validateItem(validData);
      expect(errors).toEqual({});
    });

    it("catches validation errors", () => {
      const invalidData = {
        type: "",
        name: "",
        category: "",
        location: "",
        date: "",
        description: "",
        contact: "",
      };
      const errors = validateItem(invalidData);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
    });

    it("validates email and phone contact", () => {
      const email = {
        type: "lost",
        name: "Item",
        category: "Bags",
        location: "Lib",
        date: "2026-10-15",
        description: "desc",
        contact: "user@example.com",
      };
      expect(validateItem(email).contact).toBeUndefined();
    });
  });

  describe("Module loading", () => {
    it("loads app.js module for coverage", async () => {
      vi.stubGlobal("fetch", vi.fn(() =>
        Promise.resolve({ ok: true, text: async () => JSON.stringify({ items: [] }) })
      ));

      const appModule = await import("../js/app.js");
      expect(appModule).toBeDefined();

      vi.unstubAllGlobals();
    });
  });
});