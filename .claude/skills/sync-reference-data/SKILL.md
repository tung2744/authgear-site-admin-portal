---
name: sync-reference-data
description: Rules for authoring or regenerating a local reference/lookup data file (e.g. src/data/countries.ts) whose values are validated against a backend-enforced set. Use before adding, regenerating, or extending any fixed list backing a picker/select control.
---

# Sync Reference Data With Backend Validity

## Rule

When a control needs a fixed list of valid values, and the backend enforces
that list via a JSON schema `enum` (or similar), find the backend's *actual*
source constant before authoring or regenerating the list. **Never assume a
named external standard ("ISO 3166-1 country codes", "IANA time zones", etc.)
maps 1:1 to what the backend accepts.** Backends frequently enforce a
validated subset, not the raw standard — a control that offers a value the
backend then rejects on save is a real, user-facing bug, not a cosmetic gap.

## Concrete case: `src/data/countries.ts`

Backs the `ui.phone_input.allowlist` control, validated server-side by the
`ISO31661Alpha2` JSON schema. That schema is **not** "every ISO 3166-1
code" — it's `authgear-server`'s `pkg/util/territoryutil/alpha2.go`'s
`Alpha2` list (phone-numbering-plan-based, via
`phonenumbers.GetSupportedRegions()`), which:
- **excludes** uninhabited/no-phone-plan territories the full ISO standard
  includes (Antarctica/`AQ`, Bouvet Island/`BV`, South Georgia/`GS`, Heard
  Island/`HM`, Pitcairn/`PN`, French Southern Territories/`TF`, US Minor
  Outlying Islands/`UM`)
- **includes** at least one code some ISO references omit (Kosovo/`XK`)

A version of this file built from "the ISO standard" in general drifted
from what the backend actually accepts: 7 selectable codes the backend
would reject on save, 1 valid code missing entirely from the picker.

## Before authoring or regenerating any such list

1. **Find the backend's actual enum source** in `authgear-server` — grep
   the OpenAPI spec's schema definitions, or the Go source it's
   generated/derived from. Don't assume a named standard maps onto it.
2. **Check whether a sibling app already solved this.** `authgear-server`'s
   own `portal/` frontend has the same country-code problem already solved
   and kept in sync with the backend (`portal/src/data/country.json`) —
   prefer matching an existing, verified list over re-deriving one from a
   generic reference.
3. **Diff the two code sets exactly**, not by spot-checking a few entries.
   A one-line shell diff catches this in seconds; eyeballing a 240-entry
   list does not.
4. **Add a test pinning the count and known boundary cases** (a code that
   must be present, a lookalike that must be absent) so a future edit can't
   silently drift again — see `src/data/__tests__/countries.test.ts`.
5. **Leave a comment on the data file pointing at the exact backend source
   file/constant**, not just the name of a general standard, so whoever
   updates it next diffs against the right thing, not the wrong reference.
