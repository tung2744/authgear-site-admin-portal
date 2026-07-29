import React, { useCallback, useState } from "react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { Pivot, PivotItem } from "@fluentui/react";
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

    const onReferenceLinkClick = useCallback((item?: PivotItem) => {
      const key = item?.props.itemKey as ReferenceMode | undefined;
      if (key) setReferenceMode(key);
    }, []);

    const referenceValue = JSON.stringify(
      referenceMode === "plan" ? planFeatureConfig : effectiveFeatureConfig,
      null,
      2
    );

    return (
      <div className={styles.root}>
        <div className={styles.pane}>
          <div className={styles.paneHeader}>App Config (override YAML)</div>
          <div className={styles.editorContainer}>
            <Editor
              height="100%"
              language="yaml"
              value={yamlText}
              onChange={onEditorChange}
              options={{ ...YAML_EDITOR_OPTIONS, readOnly: disabled }}
            />
          </div>
        </div>
        <div className={styles.pane}>
          <div className={styles.paneHeader}>
            <Pivot
              selectedKey={referenceMode}
              onLinkClick={onReferenceLinkClick}
              linkSize="normal"
            >
              <PivotItem headerText="Plan Config" itemKey="plan" />
              <PivotItem headerText="Effective Config" itemKey="effective" />
            </Pivot>
          </div>
          <div className={styles.editorContainer}>
            <CodeBlock value={referenceValue} language="json" />
          </div>
        </div>
      </div>
    );
  };

export default FeatureConfigYamlView;
