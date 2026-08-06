import { COUNTRIES } from "../countries";

/**
 * Pins the exact code set against authgear-server's
 * pkg/util/territoryutil/alpha2.go (243 codes, "AC"/"TA" excluded from full
 * ISO 3166-1, "XK" included) -- see the comment atop countries.ts for why
 * this must never be "every ISO 3166-1 code". If this test needs updating,
 * the corresponding list in authgear-server must be checked first, not
 * just this file.
 */

test("has exactly 243 codes, matching the backend's ISO31661Alpha2 enum size", () => {
  expect(COUNTRIES).toHaveLength(243);
});

test("has no duplicate codes", () => {
  const codes = COUNTRIES.map((c) => c.code);
  expect(new Set(codes).size).toBe(codes.length);
});

test("does not include uninhabited/no-phone-plan territories the backend rejects", () => {
  const codes = new Set(COUNTRIES.map((c) => c.code));
  for (const invalid of ["AQ", "BV", "GS", "HM", "PN", "TF", "UM"]) {
    expect(codes.has(invalid)).toBe(false);
  }
});

test("includes Kosovo (XK), which the backend accepts", () => {
  expect(COUNTRIES.some((c) => c.code === "XK")).toBe(true);
});
