import { getConfigValue } from "./config.js";
import { API_BASE_URL } from "./constants.js";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAuthHeaders(): Record<string, string> {
  const apiKey = getConfigValue("api-key");
  if (!apiKey) {
    throw new ApiError(0, "NO_API_KEY", "No API key configured. Run: tbd-vote login");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function getBaseUrl(): string {
  return getConfigValue("api-url") || API_BASE_URL;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | undefined>,
): Promise<T> {
  const url = new URL(path, getBaseUrl());
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), { headers: getAuthHeaders() });
  } catch (err) {
    throw new ApiError(0, "NETWORK_ERROR", `Network error: could not reach ${getBaseUrl()}`);
  }

  return handleResponse<T>(response);
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const url = new URL(path, getBaseUrl());

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new ApiError(0, "NETWORK_ERROR", `Network error: could not reach ${getBaseUrl()}`);
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const msg = retryAfter
      ? `Rate limited. Try again in ${retryAfter} seconds.`
      : "Rate limited. Try again later.";
    throw new ApiError(429, "RATE_LIMITED", msg);
  }

  let code = "UNKNOWN_ERROR";
  let message = `Request failed with status ${response.status}`;
  try {
    const body = await response.json();
    if (body.error) code = body.error;
    if (body.message) message = body.message;
  } catch {
    // response body wasn't JSON
  }

  throw new ApiError(response.status, code, message);
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  const baseUrl = getConfigValue("api-url") || API_BASE_URL;
  const url = new URL("/agents/campaigns", baseUrl);
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
