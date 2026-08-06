import React, { useCallback, useMemo, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import cn from "classnames";
import { stringify } from "yaml";
import type { FeatureConfig } from "../../api/types";
import CodeBlock from "../../components/CodeBlock";
import styles from "./FeatureConfigYamlView.module.css";

const YAML_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  wordWrap: "on",
  wrappingIndent: "deepIndent",
};

export interface FeatureConfigYamlViewProps {
  yamlText: string;
  onYamlTextChange: (text: string) => void;
  planName: string | null;
  planFeatureConfig: FeatureConfig;
  effectiveFeatureConfig: FeatureConfig;
  disabled?: boolean;
  /**
   * Called when the editor loses focus -- a natural pause point to show
   * validation feedback immediately, without waiting for (or interrupting)
   * the debounce that runs while the user is still typing.
   */
  onEditorBlur?: () => void;
}

type ReferenceMode = "plan" | "effective";

function referenceInfo(mode: ReferenceMode, planName: string | null): string {
  const plan = planName ?? "—";
  if (mode === "plan") {
    return `Read-only · Plan: ${plan} · No app-specific override`;
  }
  return `Read-only · Plan: ${plan} · Merged with app config`;
}

const FeatureConfigYamlView: React.VFC<FeatureConfigYamlViewProps> =
  function FeatureConfigYamlView({
    yamlText,
    onYamlTextChange,
    planName,
    planFeatureConfig,
    effectiveFeatureConfig,
    disabled,
    onEditorBlur,
  }) {
    const [referenceMode, setReferenceMode] =
      useState<ReferenceMode>("effective");

    // Read fresh in the Monaco blur listener below, which is only attached
    // once on mount -- a plain closure over the prop would go stale if
    // onEditorBlur's identity ever changes across renders.
    const onEditorBlurRef = useRef(onEditorBlur);
    onEditorBlurRef.current = onEditorBlur;

    const onEditorMount: OnMount = useCallback((editorInstance) => {
      editorInstance.onDidBlurEditorText(() => {
        onEditorBlurRef.current?.();
      });
    }, []);

    const onEditorChange = useCallback(
      (value: string | undefined) => {
        onYamlTextChange(value ?? "");
      },
      [onYamlTextChange]
    );

    const referenceValue = useMemo(
      () =>
        stringify(
          referenceMode === "plan" ? planFeatureConfig : effectiveFeatureConfig
        ),
      [referenceMode, planFeatureConfig, effectiveFeatureConfig]
    );

    return (
      <div className={styles.twoCols}>
        <div className={styles.refPanel}>
          <div className={styles.refTabs}>
            <button
              type="button"
              className={cn(
                styles.refTab,
                referenceMode === "plan" && styles.refTabActive
              )}
              onClick={() => setReferenceMode("plan")}
            >
              📋 Plan Config
            </button>
            <button
              type="button"
              className={cn(
                styles.refTab,
                referenceMode === "effective" && styles.refTabActive
              )}
              onClick={() => setReferenceMode("effective")}
            >
              ⚡ Effective Config
            </button>
          </div>
          <div className={styles.refInfoBar}>
            {referenceInfo(referenceMode, planName)}
          </div>
          <div className={styles.refContent}>
            <CodeBlock value={referenceValue} language="yaml" />
          </div>
        </div>
        <div className={styles.editColumn}>
          <div className={styles.editHeader}>App Config (override YAML)</div>
          <div className={styles.editPanel}>
            <Editor
              height="100%"
              language="yaml"
              value={yamlText}
              onChange={onEditorChange}
              onMount={onEditorMount}
              options={{ ...YAML_EDITOR_OPTIONS, readOnly: disabled }}
            />
          </div>
        </div>
      </div>
    );
  };

export default FeatureConfigYamlView;
