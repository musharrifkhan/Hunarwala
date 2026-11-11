
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


export async function createBooking(bookingData) {
  const token = localStorage.getItem("hunarwala-token");

  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(bookingData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Unable to create booking");
  }

  return data;
}


export async function getMyBookings() {
  const token = localStorage.getItem("hunarwala-token");

  const response = await fetch(`${API_BASE_URL}/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Could not fetch bookings");
  }

  return data;
}


export async function signupUser(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Signup failed");
  }

  return data;
}

export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  return data;
}

export async function getProfessionalBookings() {
  const token = localStorage.getItem("hunarwala-token");

  const response = await fetch(`${API_BASE_URL}/professional/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Could not fetch professional bookings");
  }

  return data;
}

export async function updateProfessionalBookingStatus(bookingId, status) {
  const token = localStorage.getItem("hunarwala-token");

  const response = await fetch(
    `${API_BASE_URL}/professional/bookings/${bookingId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Could not update booking status");
  }

  return data;
}
