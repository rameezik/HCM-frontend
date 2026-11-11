// Browser calls and authenticated downloads share the same-origin API proxy.
import { requestErrorMessage } from "./errorMessages.js";

export const API_BASE_URL = "/api";

function apiError(message, status, code, details) {
  const error = new Error(requestErrorMessage(status, message, details));
  error.status = status;
  error.code = code;
  if (details) error.details = details;
  return error;
}

export async function readApiResponse(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (!/\bapplication\/(?:[\w.-]+\+)?json\b/i.test(contentType)) {
    throw apiError(
      "Connection unavailable. Please try again.",
      502,
      "API_INVALID_RESPONSE",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw apiError(
      "Unable to complete your request. Please try again.",
      502,
      "API_INVALID_RESPONSE",
    );
  }
  if (!response.ok) {
    const details = Array.isArray(data?.details) ? data.details : [];
    throw apiError(
      data?.message,
      response.status,
      typeof data?.code === "string" ? data.code : "API_REQUEST_FAILED",
      details,
    );
  }
  return data;
}

export async function api(path, options = {}) {
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Use a relative API endpoint.");
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw apiError(
      "Connection error. Check your internet connection and try again.",
      0,
      "API_NETWORK_ERROR",
    );
  }
  return readApiResponse(response);
}
