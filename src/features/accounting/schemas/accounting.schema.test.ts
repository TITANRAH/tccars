import { describe, expect, it } from "vitest"
import { accountingFilterSchema } from "@/features/accounting/schemas/accounting.schema"

describe("accountingFilterSchema", () => {
  it("accepts all filters empty (no filtering)", () => {
    expect(accountingFilterSchema.safeParse({}).success).toBe(true)
  })

  it("accepts a full set of filters", () => {
    expect(
      accountingFilterSchema.safeParse({
        from: "2026-01-01",
        to: "2026-09-07",
        collaboratorId: "collab-1",
      }).success
    ).toBe(true)
  })
})
