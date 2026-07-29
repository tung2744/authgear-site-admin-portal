import React, { useCallback, useState } from "react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import cn from "classnames";
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
  planFeatureConfig: FeatureConfig;
  effectiveFeatureConfig: FeatureConfig;
  disabled?: boolean;
}

type ReferenceMode = "plan" | "effective";

const REFERENCE_INFO: Record<ReferenceMode, string> = {
  plan: "Read-only · What this app would get with no app-specific override",
  effective: "Read-only · Computed result — plan merged with app config",
};

const FeatureConfigYamlView: React.VFC<FeatureConfigYamlViewProps> =
  function FeatureConfigYamlView({
    yamlText,
    onYamlTextChange,
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

    const referenceValue = JSON.stringify(
      referenceMode === "plan" ? planFeatureConfig : effectiveFeatureConfig,
      null,
      2
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
            {REFERENCE_INFO[referenceMode]}
          </div>
          <div className={styles.refContent}>
            <CodeBlock value={referenceValue} language="json" />
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
