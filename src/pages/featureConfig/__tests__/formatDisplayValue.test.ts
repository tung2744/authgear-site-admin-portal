import { formatDisplayValue } from "../formatDisplayValue";

/**
 * Pins that nil and an explicit empty list are treated identically for the
 * countryList control -- both mean "no restriction" (IntersectAllowlist),
 * matching CountryListFieldControl's own "Allow all countries" label. A
 * plan that never sets phone_input.allowlist produces a nil AllowList
 * (Go's zero value for an unset slice), distinct from an app override
 * explicitly clearing it to [] -- both must display the same way.
 */

test("countryList: nil shows 'Allow all countries', not the generic dash", () => {
  expect(formatDisplayValue("countryList", null)).toBe("Allow all countries");
  expect(formatDisplayValue("countryList", undefined)).toBe(
    "Allow all countries"
  );
});

test("countryList: explicit empty list also shows 'Allow all countries'", () => {
  expect(formatDisplayValue("countryList", [])).toBe("Allow all countries");
});

test("countryList: non-empty list joins the codes", () => {
  expect(formatDisplayValue("countryList", ["US", "GB"])).toBe("US, GB");
});

test("boolean/number controls keep the generic dash for nil", () => {
  expect(formatDisplayValue("boolean", null)).toBe("—");
  expect(formatDisplayValue("number", undefined)).toBe("—");
});

test("boolean control formats true/false as Enabled/Disabled", () => {
  expect(formatDisplayValue("boolean", true)).toBe("Enabled");
  expect(formatDisplayValue("boolean", false)).toBe("Disabled");
});
