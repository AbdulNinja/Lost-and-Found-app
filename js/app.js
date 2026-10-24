import {
  loadItems,
  reportItem,
  saveItemChanges,
  markRecovered,
  deleteItem,
  filterItems,
  validateItem,
} from "./items.js";


const form = document.getElementById("item-form");
const formHeading = document.getElementById("form-heading");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-edit");
const filtersForm = document.getElementById("filters");
const listEl = document.getElementById("item-list");
const statusEl = document.getElementById("status-message");
const template = document.getElementById("item-template");
const dateInput = document.getElementById("date");

const filterControls = {
  query: document.getElementById("search"),
  type: document.getElementById("filter-type"),
  category: document.getElementById("filter-category"),
  status: document.getElementById("filter-status"),
};

let allItems = []; 
let editingId = null; 

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("is-error", isError);
}

function setBusy(isBusy) {
  submitBtn.disabled = isBusy;
  if (isBusy) {
    submitBtn.textContent = "Saving…";
  } else {
    submitBtn.textContent = editingId === null ? "Submit report" : "Save changes";
  }
}

function currentFilters() {
  return {
    query: filterControls.query.value,
    type: filterControls.type.value,
    category: filterControls.category.value,
    status: filterControls.status.value,
  };
}

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function buildCard(item) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.dataset.id = item.id;
  node.dataset.type = item.type;
  node.classList.toggle("is-recovered", item.recovered);

  const typeBadge = node.querySelector(".badge-type");
  typeBadge.textContent = item.type;
  typeBadge.dataset.type = item.type;

  node.querySelector(".badge-status").hidden = !item.recovered;
  node.querySelector(".card-title").textContent = item.name;
  node.querySelector(".card-meta").textContent =
    `${item.category} · ${item.location} · ${formatDate(item.date)}`;
  node.querySelector(".card-desc").textContent = item.description;
  node.querySelector(".card-contact").textContent = `Contact: ${item.contact}`;
  node.querySelector('[data-action="recover"]').disabled = item.recovered;
  return node;
}

function render() {
  const visible = filterItems(allItems, currentFilters());
  listEl.replaceChildren(...visible.map(buildCard));

  if (allItems.length === 0) {
    setStatus("No reports yet. Use the form to add the first one.");
  } else if (visible.length === 0) {
    setStatus("No items match your search or filters.");
  } else {
    `setStatus(Showing ${visible.length} of ${allItems.length} item${allItems.length === 1 ? "" : "s"}.)`;
  }
}

function showErrors(errors) {
  form.querySelectorAll("[data-error-for]").forEach((p) => {
    const field = p.dataset.errorFor;
    p.textContent = errors[field] || "";
    const input = form.elements[field];
    if (input && input.classList) input.classList.toggle("is-invalid", Boolean(errors[field]));
  });
}

async function reload() {
  allItems = await loadItems(); // GET
  render();
}
async function runAction(action, successMessage) {
  setStatus("Working…");
  try {
    await action();
    await reload();
    setStatus(successMessage);
    return true;
  } catch (error) {
    `setStatus(Something went wrong: ${error.message}. Please try again., true)`;
    return false;
  }
}

function enterEditMode(item) {
  editingId = item.id;
  form.elements.type.value = item.type;
  form.elements.name.value = item.name;
  form.elements.category.value = item.category;
  form.elements.location.value = item.location;
  form.elements.date.value = item.date;
  form.elements.description.value = item.description;
  form.elements.contact.value = item.contact;

  formHeading.textContent = "Edit item";
  cancelBtn.hidden = false;
  setBusy(false);
  form.elements.name.focus();
}

function leaveEditMode() {
  editingId = null;
  form.reset();
  showErrors({});
  formHeading.textContent = "Report an item";
  cancelBtn.hidden = true;
  dateInput.max = todayISO();
  setBusy(false);
}


form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const errors = validateItem(data);
  showErrors(errors);

  if (Object.keys(errors).length > 0) {
    const firstBad = Object.keys(errors).find((key) => form.elements[key]);
    if (firstBad) form.elements[firstBad].focus();
    return;
  }

  const isEditing = editingId !== null;
  const existing = allItems.find((item) => String(item.id) === String(editingId));

  setBusy(true);
  const ok = await runAction(
    () => (isEditing ? saveItemChanges(existing, data) : reportItem(data)), // PUT or POST
    isEditing ? "Changes saved." : "Report added."
  );
  if (ok) {
    leaveEditMode();
  } else {
    setBusy(false);
  }
});

cancelBtn.addEventListener("click", () => {
  leaveEditMode();
  render();
});


listEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.closest(".card").dataset.id;
  const action = button.dataset.action;

  if (action === "recover") {
    await runAction(() => markRecovered(id), "Item marked as recovered."); // PATCH
  } else if (action === "edit") {
    const item = allItems.find((entry) => String(entry.id) === id);
    if (item) enterEditMode(item);
  } else if (action === "delete") {
    if (confirm("Delete this listing? This cannot be undone.")) {
      await runAction(() => deleteItem(id), "Listing deleted."); // DELETE
    }
  }
});

filtersForm.addEventListener("input", render);
filtersForm.addEventListener("submit", (event) => event.preventDefault());

// ---------- Start ----------
async function init() {
  dateInput.max = todayISO();
  setStatus("Loading items…");
  try {
    await reload(); // GET
  } catch {
    setStatus("Could not load items. Check that the API server is running.", true);
  }
}

init();