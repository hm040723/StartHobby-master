// src/api.js

const API_BASE_URL = "https://start-hobby-master.vercel.app/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  console.log("[API] Request:", { url: `${API_BASE_URL}${path}`, options });

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // handle API error
  if (!res.ok) {
    let message = `Error: ${res.status}`;
    try {
      const body = await res.json(); // try read json
      message = body?.error || body?.message || message;
    } catch (e) {
      console.warn("[API] No JSON body in response");
    }
    throw new Error(message);
  }

  // return JSON or null if empty
  try {
    return await res.json();
  } catch {
    console.warn("[API] No JSON body in response");
    return null;
  }
}

export { API_BASE_URL };
