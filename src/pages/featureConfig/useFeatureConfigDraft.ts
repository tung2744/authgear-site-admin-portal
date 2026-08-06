import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAppFeatureConfig,
  previewAppFeatureConfig,
  updateAppFeatureConfig,
} from "../../api/siteadmin";
import { SiteAdminAPIError } from "../../api/client";
import type { FeatureConfig, ValidationErrorCause } from "../../api/types";
import { FIELD_REGISTRY } from "./fieldRegistry";
import { formatValidationCauses, mapCausesToFields } from "./errorMapping";

const PREVIEW_DEBOUNCE_MS = 900;

function describeError(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

/**
 * Extracts `info.causes` from a `ValidationFailed` error, per the API's
 * validation error contract. Multi-document-YAML rejections carry
 * `ValidationFailed` with no `causes` at all — callers must not assume
 * `causes` exists just because `reason` is `ValidationFailed`.
 */
function extractCauses(e: unknown): ValidationErrorCause[] | null {
  if (e instanceof SiteAdminAPIError && e.reason === "ValidationFailed") {
    const causes = e.info?.causes;
    if (Array.isArray(causes)) {
      return causes as ValidationErrorCause[];
    }
  }
  return null;
}

/**
 * Prefers a per-cause message (e.g. "Invalid input at /a/b: type") over the
 * server's generic top-level message (e.g. "invalid feature config"), which
 * carries no specifics. Falls back to describeError for errors with no
 * causes at all -- network failures, and the multi-document-YAML rejection,
 * which is ValidationFailed but deliberately carries no causes since the
 * failure isn't about any one field.
 */
function describeValidationError(
  e: unknown,
  causes: ValidationErrorCause[] | null,
  fallback: string
): string {
  return causes && causes.length > 0
    ? formatValidationCauses(causes)
    : describeError(e, fallback);
}

export interface FeatureConfigDraft {
  loading: boolean;
  loadError: string | null;
  planName: string | null;

  /** Canonical editable state — the override YAML text. */
  yamlText: string;
  /** Last-saved YAML text, used as the dirty-check baseline. */
  savedYamlText: string;
  dirty: boolean;

  effectivePlan: FeatureConfig | null;
  /** Effective config for `yamlText`, always from GET/preview — never merged client-side. */
  effective: FeatureConfig | null;
  previewLoading: boolean;

  /** Generic banner message for the most recent preview or save failure. */
  errorMessage: string | null;
  /** Validation causes mapped onto known field-registry rows, for row highlighting. */
  validationCauses: Map<string, ValidationErrorCause[]> | null;

  saving: boolean;
  saveSuccess: boolean;

  setYamlText: (text: string) => void;
  save: () => void;
  discard: () => void;
  /**
   * Runs the preview immediately, cancelling any pending debounced call.
   * Meant for a natural pause point such as the YAML editor losing focus,
   * so validation feedback doesn't interrupt active typing but still
   * appears promptly once the user steps away to look at it.
   */
  triggerPreviewNow: () => void;
}

export default function useFeatureConfigDraft(
  appId: string
): FeatureConfigDraft {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);

  const [yamlText, setYamlTextState] = useState("");
  const [savedYamlText, setSavedYamlText] = useState("");

  const [effectivePlan, setEffectivePlan] = useState<FeatureConfig | null>(
    null
  );
  const [effective, setEffective] = useState<FeatureConfig | null>(null);
  const [savedEffective, setSavedEffective] = useState<FeatureConfig | null>(
    null
  );

  const [previewLoading, setPreviewLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationCauses, setValidationCauses] = useState<Map<
    string,
    ValidationErrorCause[]
  > | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const previewSeq = useRef(0);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    getAppFeatureConfig(appId)
      .then((res) => {
        setPlanName(res.plan_name);
        setEffectivePlan(res.effective_plan_feature_config);
        setEffective(res.effective_app_feature_config);
        setSavedEffective(res.effective_app_feature_config);
        setYamlTextState(res.app_feature_config_yaml);
        setSavedYamlText(res.app_feature_config_yaml);
      })
      .catch((e: unknown) => {
        setLoadError(describeError(e, "Failed to load feature config."));
      })
      .finally(() => setLoading(false));
  }, [appId]);

  // Live "Effective" feedback while editing, always computed server-side via
  // the preview endpoint — never merged client-side. Stale in-flight
  // responses are ignored so an older response can't overwrite a newer one.
  const runPreview = useCallback(
    (text: string) => {
      const seq = ++previewSeq.current;
      setPreviewLoading(true);
      previewAppFeatureConfig(appId, text)
        .then((res) => {
          if (previewSeq.current !== seq) return;
          setEffective(res.effective_app_feature_config);
          setErrorMessage(null);
          setValidationCauses(null);
        })
        .catch((e: unknown) => {
          if (previewSeq.current !== seq) return;
          const causes = extractCauses(e);
          setErrorMessage(
            describeValidationError(
              e,
              causes,
              "Failed to preview feature config."
            )
          );
          setValidationCauses(
            causes ? mapCausesToFields(causes, FIELD_REGISTRY) : null
          );
        })
        .finally(() => {
          if (previewSeq.current === seq) setPreviewLoading(false);
        });
    },
    [appId]
  );

  // Debounced while typing, so an intermediate (often invalid) document
  // doesn't flash a validation error mid-edit -- triggerPreviewNow below
  // provides an immediate path for natural pause points instead.
  useEffect(() => {
    if (loading || loadError != null) return;

    previewTimer.current = setTimeout(() => {
      previewTimer.current = null;
      runPreview(yamlText);
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      if (previewTimer.current != null) {
        clearTimeout(previewTimer.current);
        previewTimer.current = null;
      }
    };
  }, [yamlText, loading, loadError, runPreview]);

  const triggerPreviewNow = useCallback(() => {
    if (previewTimer.current != null) {
      clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
    runPreview(yamlText);
  }, [runPreview, yamlText]);

  const setYamlText = useCallback((text: string) => {
    setYamlTextState(text);
    setSaveSuccess(false);
  }, []);

  const save = useCallback(() => {
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    updateAppFeatureConfig(appId, yamlText)
      .then((res) => {
        setPlanName(res.plan_name);
        setEffectivePlan(res.effective_plan_feature_config);
        setEffective(res.effective_app_feature_config);
        setSavedEffective(res.effective_app_feature_config);
        setYamlTextState(res.app_feature_config_yaml);
        setSavedYamlText(res.app_feature_config_yaml);
        setValidationCauses(null);
        setSaveSuccess(true);
      })
      .catch((e: unknown) => {
        const causes = extractCauses(e);
        setErrorMessage(
          describeValidationError(e, causes, "Failed to save feature config.")
        );
        setValidationCauses(
          causes ? mapCausesToFields(causes, FIELD_REGISTRY) : null
        );
      })
      .finally(() => setSaving(false));
  }, [appId, yamlText]);

  const discard = useCallback(() => {
    setYamlTextState(savedYamlText);
    setEffective(savedEffective);
    setErrorMessage(null);
    setValidationCauses(null);
    setSaveSuccess(false);
  }, [savedYamlText, savedEffective]);

  return {
    loading,
    loadError,
    planName,
    yamlText,
    savedYamlText,
    dirty: yamlText !== savedYamlText,
    effectivePlan,
    effective,
    previewLoading,
    errorMessage,
    validationCauses,
    saving,
    saveSuccess,
    setYamlText,
    save,
    discard,
    triggerPreviewNow,
  };
}
