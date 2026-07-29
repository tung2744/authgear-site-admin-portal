/**
 * Declarative table-view field list for the Feature Config tab.
 *
 * Adding another feature-config field to the table means adding one entry
 * here — the table-rendering component (`FeatureConfigTableView.tsx`) is a
 * single generic loop over this array, dispatching to a control component per
 * `control` kind. It never branches on individual field names. Extend the
 * `FieldControlKind` union only when a genuinely new UI widget is needed.
 *
 * `jsonPointer` is an RFC 6901 pointer into the `FeatureConfig` object,
 * verified against the Go struct tags in
 * `authgear-server/pkg/lib/config/feature_*.go`.
 */

export type FieldControlKind = "boolean" | "number" | "countryList";

export interface FieldDef {
  jsonPointer: string;
  label: string;
  control: FieldControlKind;
}

/**
 * Provider keys from `OAuthSSOProvidersFeatureConfig`
 * (pkg/lib/config/feature_identity.go) — one boolean row per provider at
 * `/identity/oauth/providers/<name>/disabled`.
 */
const OAUTH_PROVIDERS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "google", label: "Google" },
  { key: "facebook", label: "Facebook" },
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "azureadv2", label: "Azure AD v2" },
  { key: "azureadb2c", label: "Azure AD B2C" },
  { key: "adfs", label: "ADFS" },
  { key: "apple", label: "Apple" },
  { key: "wechat", label: "WeChat" },
];

export const FIELD_REGISTRY: FieldDef[] = [
  ...OAUTH_PROVIDERS.map(
    (provider): FieldDef => ({
      jsonPointer: `/identity/oauth/providers/${provider.key}/disabled`,
      label: `Disable ${provider.label} sign-in`,
      control: "boolean",
    })
  ),
  {
    jsonPointer: "/ui/white_labeling/disabled",
    label: "Disable white labeling",
    control: "boolean",
  },
  {
    jsonPointer: "/ui/phone_input/allowlist",
    label: "Phone input country allowlist",
    control: "countryList",
  },
  {
    jsonPointer: "/oauth/client/maximum",
    label: "Maximum OAuth clients",
    control: "number",
  },
  {
    jsonPointer: "/oauth/client/soft_maximum",
    label: "Soft maximum OAuth clients",
    control: "number",
  },
  {
    jsonPointer: "/oauth/client/custom_ui_enabled",
    label: "Custom UI enabled",
    control: "boolean",
  },
  {
    jsonPointer: "/oauth/client/app2app_enabled",
    label: "App2App enabled",
    control: "boolean",
  },
  {
    jsonPointer: "/hook/blocking_handler/maximum",
    label: "Maximum blocking hook handlers",
    control: "number",
  },
  {
    jsonPointer: "/hook/non_blocking_handler/maximum",
    label: "Maximum non-blocking hook handlers",
    control: "number",
  },
  {
    jsonPointer: "/audit_log/retrieval_days",
    label: "Audit log retrieval days",
    control: "number",
  },
  {
    jsonPointer: "/messaging/custom_sms_provider_disabled",
    label: "Disable custom SMS provider",
    control: "boolean",
  },
  {
    jsonPointer: "/messaging/custom_smtp_disabled",
    label: "Disable custom SMTP",
    control: "boolean",
  },
  {
    jsonPointer: "/messaging/template_customization_disabled",
    label: "Disable template customization",
    control: "boolean",
  },
  {
    jsonPointer: "/fraud_protection/is_modifiable",
    label: "Fraud protection is modifiable",
    control: "boolean",
  },
];
