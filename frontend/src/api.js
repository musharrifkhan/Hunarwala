
const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function getServices(search = "", category = "") {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.append("search", search.trim());
  }

  if (category) {
    params.append("category", category);
  }

  const response = await fetch(
    `${API_BASE_URL}/services?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }

  return response.json();
}

export async function getCategories() {
  const response = await fetch(`${API_BASE_URL}/categories`);

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
}

export async function getServiceBySlug(slug) {
  const response = await fetch(`${API_BASE_URL}/services/${slug}`);

  if (!response.ok) {
    throw new Error("Service details could not be loaded");
  }

  return response.json();
}
