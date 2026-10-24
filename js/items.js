// export const API_BASE_URL = "http://localhost:3000";

export const API_BASE_URL = "https://lost-and-found-app-4qaw.onrender.com";
export const ITEMS_ENDPOINT = `${API_BASE_URL}/items`;


async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  }); 



  if (!response.ok) {
    throw new `Error(Request failed with status ${response.status})`;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}



export function validateItem(data) {
  const errors = {};
  const name = (data.name || "").trim();
  const location = (data.location || "").trim();
  const description = (data.description || "").trim();
  const contact = (data.contact || "").trim();

  if (!["lost", "found"].includes(data.type)) errors.type = "Choose lost or found.";
  if (name.length < 2) errors.name = "Enter an item name (at least 2 characters).";
  if (!data.category) errors.category = "Select a category.";
  if (location.length < 2) errors.location = "Enter where it was lost or found.";

  const today = new Date().toISOString().split("T")[0];
  if (!data.date) {
    errors.date = "Pick a date.";
  } else if (data.date > today) {
    errors.date = "The date cannot be in the future.";
  }

  if (description.length < 5) errors.description = "Add a short description (at least 5 characters).";

  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const looksLikePhone = /^[+\d][\d\s-]{6,}$/.test(contact);
  if (!looksLikeEmail && !looksLikePhone) errors.contact = "Enter a valid email or phone number.";

  return errors;
}


function cleanFields(data) {
  return {
    type: data.type,
    name: data.name.trim(),
    category: data.category,
    location: data.location.trim(),
    date: data.date,
    description: data.description.trim(),
    contact: data.contact.trim(),
  };
}


export function filterItems(items, filters = {}) {
  const { query = "", type = "all", category = "all", status = "all" } = filters;
  const search = query.trim().toLowerCase();

  return items.filter((item) => {
    if (type !== "all" && item.type !== type) return false;
    if (category !== "all" && item.category !== category) return false;
    if (status === "active" && item.recovered) return false;
    if (status === "recovered" && !item.recovered) return false;

    if (search) {
      const text = `${item.name} ${item.location} ${item.description}.toLowerCase()`;
      if (!text.includes(search)) return false;
    }
    return true;
  });
}



export async function loadItems() {
  const items = await request(ITEMS_ENDPOINT);
  return [...items].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}


export function reportItem(data) {
  const newItem = {
    ...cleanFields(data),
    recovered: false,
    createdAt: new Date().toISOString(),
  };
  return request(ITEMS_ENDPOINT, { method: "POST", body: JSON.stringify(newItem) });
}


export function saveItemChanges(existing, data) {
  const updated = { ...existing, ...cleanFields(data) };
  return request(`${ITEMS_ENDPOINT}/${existing.id}, { method: "PUT", body: JSON.stringify(updated) }`);
}


export function markRecovered(id) {
  return request(`${ITEMS_ENDPOINT}/${id}, { method: "PATCH", body: JSON.stringify({ recovered: true }) }`);
}


export function deleteItem(id) {
  return request(`${ITEMS_ENDPOINT}/${id}, { method: "DELETE" }`);
}