import { formatValidationCauses } from "../errorMapping";
import type { ValidationErrorCause } from "../../../api/types";

test("formats a single cause as 'Invalid input at <location>: <kind>'", () => {
  const causes: ValidationErrorCause[] = [
    { location: "/authentication/lockout/password/enabled", kind: "type" },
  ];
  expect(formatValidationCauses(causes)).toBe(
    "Invalid input at /authentication/lockout/password/enabled: type"
  );
});

test("concatenates multiple causes together", () => {
  const causes: ValidationErrorCause[] = [
    { location: "/oauth/client/maximum", kind: "type" },
    { location: "/collaborator/maximum", kind: "minimum" },
  ];
  expect(formatValidationCauses(causes)).toBe(
    "Invalid input at /oauth/client/maximum: type; Invalid input at /collaborator/maximum: minimum"
  );
});

test("substitutes a readable label for the document-root location", () => {
  const causes: ValidationErrorCause[] = [{ location: "", kind: "required" }];
  expect(formatValidationCauses(causes)).toBe(
    "Invalid input at the document: required"
  );
});

test("ignores details, only location and kind are shown", () => {
  const causes: ValidationErrorCause[] = [
    {
      location: "/oauth/client/maximum",
      kind: "type",
      details: { actual: "string", expected: "integer" },
    },
  ];
  expect(formatValidationCauses(causes)).toBe(
    "Invalid input at /oauth/client/maximum: type"
  );
});
