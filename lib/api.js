// Same-origin requests are proxied by Next.js to Express; credentials remain HttpOnly.
export const API_BASE_URL = "/api";
export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = { message: "The service returned an invalid response." };
  }
  if (!response.ok) {
    const error = new Error(
      [
        data.message || "Request failed.",
        ...(data.details || []).map((d) => `${d.field}: ${d.reason}`),
      ].join(" "),
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
