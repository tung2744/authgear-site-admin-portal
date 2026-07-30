import React, { useCallback, useMemo, useState } from "react";
import {
  DefaultButton,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Spinner,
  SpinnerSize,
} from "@fluentui/react";
import cn from "classnames";
import { Document, parseDocument } from "yaml";
import useFeatureConfigDraft from "./featureConfig/useFeatureConfigDraft";
import FeatureConfigTableView from "./featureConfig/FeatureConfigTableView";
import FeatureConfigYamlView from "./featureConfig/FeatureConfigYamlView";
import { documentToYamlText } from "./featureConfig/yamlDocumentEdits";
import styles from "./FeatureConfigContent.module.css";

export interface FeatureConfigContentProps {
  appId: string;
}

type ViewMode = "table" | "yaml";

const FeatureConfigContent: React.VFC<FeatureConfigContentProps> =
  function FeatureConfigContent({ appId }) {
    const draft = useFeatureConfigDraft(appId);
    const [view, setView] = useState<ViewMode>("table");

    const parsedDoc: Document | null = useMemo(() => {
      try {
        return parseDocument(draft.yamlText);
      } catch {
        return null;
      }
    }, [draft.yamlText]);

    const parseError =
      parsedDoc == null
        ? "Failed to parse YAML."
        : parsedDoc.errors.length > 0
          ? parsedDoc.errors[0].message
          : null;

    // Table -> YAML is always safe; YAML -> table requires parseable YAML
    // since the table view reads the document directly.
    const onSelectView = useCallback(
      (mode: ViewMode) => {
        if (mode === "table" && parseError != null) return;
        setView(mode);
      },
      [parseError]
    );

    const onDocChange = useCallback(
      (nextDoc: Document) => {
        draft.setYamlText(documentToYamlText(nextDoc));
      },
      [draft]
    );

    if (draft.loading) {
      return (
        <div className={styles.loadingRoot}>
          <Spinner size={SpinnerSize.large} />
        </div>
      );
    }

    if (draft.loadError) {
      return (
        <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
          {draft.loadError}
        </MessageBar>
      );
    }

    return (
      <div className={styles.root}>
        <div className={styles.viewToggleRow}>
          <div className={styles.modeToggle}>
            <button
              type="button"
              className={cn(
                styles.modeBtn,
                styles.modeBtnLeft,
                view === "table" && styles.modeBtnActive
              )}
              onClick={() => onSelectView("table")}
            >
              Table
            </button>
            <button
              type="button"
              className={cn(
                styles.modeBtn,
                view === "yaml" && styles.modeBtnActive
              )}
              onClick={() => onSelectView("yaml")}
            >
              YAML
            </button>
          </div>
        </div>

        {parseError && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {parseError}
          </MessageBar>
        )}
        {draft.errorMessage && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {draft.errorMessage}
          </MessageBar>
        )}
        {draft.saveSuccess && (
          <MessageBar
            messageBarType={MessageBarType.success}
            isMultiline={false}
          >
            Feature config saved.
          </MessageBar>
        )}

        {view === "table" && parsedDoc && parseError == null && (
          <FeatureConfigTableView
            doc={parsedDoc}
            onDocChange={onDocChange}
            planFeatureConfig={draft.effectivePlan ?? {}}
            fieldErrors={draft.validationCauses ?? new Map()}
            disabled={draft.saving}
          />
        )}

        {view === "yaml" && (
          <FeatureConfigYamlView
            yamlText={draft.yamlText}
            onYamlTextChange={draft.setYamlText}
            planName={draft.planName}
            planFeatureConfig={draft.effectivePlan ?? {}}
            effectiveFeatureConfig={draft.effective ?? {}}
            disabled={draft.saving}
          />
        )}

        <div className={styles.actionBar}>
          <DefaultButton
            text="Discard"
            onClick={draft.discard}
            disabled={!draft.dirty || draft.saving}
          />
          <PrimaryButton
            text={draft.saving ? "Saving…" : "Save"}
            onClick={draft.save}
            disabled={!draft.dirty || draft.saving || parseError != null}
            styles={{
              root: { backgroundColor: "#176df3", borderColor: "#176df3" },
              rootHovered: {
                backgroundColor: "#1562db",
                borderColor: "#1562db",
              },
            }}
          />
        </div>
      </div>
    );
  };

export default FeatureConfigContent;
