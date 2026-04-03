import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiGet, apiPost, ApiError, validateApiKey } from "../../lib/api.js";

vi.mock("../../lib/config.js", () => ({
  getConfigValue: vi.fn((key: string) => {
    if (key === "api-key") return "tbd_api_testkey123";
    if (key === "api-url") return "https://api.test.tbd.vote";
    return null;
  }),
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
  };
}

describe("apiGet", () => {
  it("sends GET with auth header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ campaigns: [] }));

    await apiGet("/agents/campaigns");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.tbd.vote/agents/campaigns",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer tbd_api_testkey123",
        }),
      }),
    );
  });

  it("passes query params correctly", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ campaigns: [] }));

    await apiGet("/agents/campaigns", { status: "open", limit: "5" });

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("status=open");
    expect(url).toContain("limit=5");
  });

  it("skips undefined params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ campaigns: [] }));

    await apiGet("/agents/campaigns", { status: "open", cursor: undefined });

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("status=open");
    expect(url).not.toContain("cursor");
  });

  it("throws NETWORK_ERROR on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    try {
      await apiGet("/test");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("NETWORK_ERROR");
    }
  });

  it("throws RATE_LIMITED on 429 with Retry-After", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({}, 429, { "Retry-After": "30" }),
    );

    try {
      await apiGet("/test");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("RATE_LIMITED");
      expect((err as ApiError).message).toContain("30 seconds");
    }
  });

  it("throws RATE_LIMITED on 429 without Retry-After", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 429));

    try {
      await apiGet("/test");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).message).toContain("Try again later");
    }
  });

  it("parses error body on non-2xx", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "CAMPAIGN_NOT_FOUND", message: "Not found" }, 404),
    );

    try {
      await apiGet("/test");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("CAMPAIGN_NOT_FOUND");
      expect((err as ApiError).message).toBe("Not found");
    }
  });
});

describe("apiPost", () => {
  it("sends POST with JSON body and auth header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ txSignature: "abc123" }));

    await apiPost("/agents/txns/place-bet", {
      campaign_id: 1,
      option_id: 2,
      amount: 1.0,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.tbd.vote/agents/txns/place-bet",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ campaign_id: 1, option_id: 2, amount: 1.0 }),
        headers: expect.objectContaining({
          Authorization: "Bearer tbd_api_testkey123",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("throws on non-2xx with parsed error body", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "INSUFFICIENT_BALANCE", message: "Not enough USDC" }, 400),
    );

    try {
      await apiPost("/test", {});
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("INSUFFICIENT_BALANCE");
    }
  });
});

describe("validateApiKey", () => {
  it("returns true on 200", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ campaigns: [] }));
    expect(await validateApiKey("tbd_api_valid")).toBe(true);
  });

  it("returns false on 401", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 401));
    expect(await validateApiKey("tbd_api_invalid")).toBe(false);
  });

  it("returns false on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    expect(await validateApiKey("tbd_api_any")).toBe(false);
  });
});
