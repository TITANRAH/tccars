import { afterEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { isValidN8nRequest } from "@/lib/n8n-auth"

function requestWithApiKey(apiKey: string | null) {
  const headers = new Headers()
  if (apiKey !== null) headers.set("x-api-key", apiKey)
  return new NextRequest("http://localhost:3000/api/n8n/proveedores", { headers })
}

describe("isValidN8nRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("rejects when N8N_API_KEY is not configured, even with a matching header", () => {
    vi.stubEnv("N8N_API_KEY", "")
    expect(isValidN8nRequest(requestWithApiKey(""))).toBe(false)
  })

  it("rejects when the header is missing", () => {
    vi.stubEnv("N8N_API_KEY", "secret123")
    expect(isValidN8nRequest(requestWithApiKey(null))).toBe(false)
  })

  it("rejects when the header doesn't match", () => {
    vi.stubEnv("N8N_API_KEY", "secret123")
    expect(isValidN8nRequest(requestWithApiKey("wrong"))).toBe(false)
  })

  it("accepts when the header matches exactly", () => {
    vi.stubEnv("N8N_API_KEY", "secret123")
    expect(isValidN8nRequest(requestWithApiKey("secret123"))).toBe(true)
  })
})
