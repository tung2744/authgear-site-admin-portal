import React, { useCallback, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
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
  }) {
    const [referenceMode, setReferenceMode] =
      useState<ReferenceMode>("effective");

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
              options={{ ...YAML_EDITOR_OPTIONS, readOnly: disabled }}
            />
          </div>
        </div>
      </div>
    );
  };

export default FeatureConfigYamlView;
