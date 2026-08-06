import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChoiceGroup,
  IChoiceGroupOption,
  ITag,
  TagPicker,
} from "@fluentui/react";
import { COUNTRIES } from "../../data/countries";
import styles from "./CountryListFieldControl.module.css";

export interface CountryListFieldControlProps {
  /**
   * Current override value:
   * - `undefined` — not overridden, inherit from plan
   * - `[]` — explicitly overridden to allow all countries
   * - non-empty — restricted to these ISO 3166-1 alpha-2 codes
   */
  value: string[] | undefined;
  disabled?: boolean;
  onChange: (value: string[] | undefined) => void;
}

type Mode = "inherit" | "allowAll" | "restrict";

function deriveMode(value: string[] | undefined): Mode {
  if (value === undefined) return "inherit";
  if (value.length === 0) return "allowAll";
  return "restrict";
}

const MODE_OPTIONS: IChoiceGroupOption[] = [
  { key: "inherit", text: "Inherit from plan" },
  { key: "allowAll", text: "Allow all countries" },
  { key: "restrict", text: "Restrict to selected countries" },
];

function countryTag(code: string): ITag {
  const country = COUNTRIES.find((c) => c.code === code);
  return { key: code, name: country ? `${country.name} (${code})` : code };
}

const CountryListFieldControl: React.VFC<CountryListFieldControlProps> =
  function CountryListFieldControl({ value, disabled, onChange }) {
    // `mode` is mostly derived from `value`, but an empty `restrict` list is
    // indistinguishable from `allowAll` by value alone — this local state
    // lets a user keep editing an emptied restrict-list without the control
    // silently flipping to "allow all countries" underneath them.
    const [mode, setMode] = useState<Mode>(() => deriveMode(value));

    useEffect(() => {
      if (value === undefined) {
        setMode("inherit");
      } else if (value.length > 0) {
        setMode("restrict");
      }
    }, [value]);

    const onModeChange = useCallback(
      (
        _e?: React.FormEvent<HTMLElement | HTMLInputElement>,
        option?: IChoiceGroupOption
      ) => {
        const next = (option?.key as Mode | undefined) ?? "inherit";
        setMode(next);
        if (next === "inherit") {
          onChange(undefined);
        } else if (next === "allowAll") {
          onChange([]);
        } else {
          onChange(value && value.length > 0 ? value : []);
        }
      },
      [onChange, value]
    );

    const selectedTags: ITag[] = useMemo(
      () => (value ?? []).map(countryTag),
      [value]
    );

    const onResolveSuggestions = useCallback(
      (filter: string, selected?: ITag[]): ITag[] => {
        const selectedKeys = new Set((selected ?? []).map((t) => t.key));
        const lower = filter.toLowerCase();
        return COUNTRIES.filter(
          (c) =>
            !selectedKeys.has(c.code) &&
            (c.code.toLowerCase().startsWith(lower) ||
              c.name.toLowerCase().includes(lower))
        )
          .slice(0, 20)
          .map((c) => countryTag(c.code));
      },
      []
    );

    const onTagsChange = useCallback(
      (items?: ITag[]) => {
        onChange((items ?? []).map((t) => t.key as string));
      },
      [onChange]
    );

    return (
      <div className={styles.root}>
        <ChoiceGroup
          className={styles.modeChoice}
          options={MODE_OPTIONS}
          selectedKey={mode}
          disabled={disabled}
          onChange={onModeChange}
        />
        {mode === "restrict" && (
          <TagPicker
            className={styles.picker}
            selectedItems={selectedTags}
            onResolveSuggestions={onResolveSuggestions}
            onChange={onTagsChange}
            disabled={disabled}
          />
        )}
      </div>
    );
  };

export default CountryListFieldControl;
