import React, { useCallback, useEffect, useState } from "react";
import { Checkbox, TextField } from "@fluentui/react";
import styles from "./NumberFieldControl.module.css";

export interface NumberFieldControlProps {
  /** Current override value; `undefined` means "not overridden, inherit from plan". */
  value: number | undefined;
  /** Effective plan value, used as the starting value when override is turned on. */
  planValue: unknown;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
}

const NumberFieldControl: React.VFC<NumberFieldControlProps> =
  function NumberFieldControl({ value, planValue, disabled, onChange }) {
    const overridden = value !== undefined;
    // Local text mirrors `value` but tolerates in-progress input (e.g. "-",
    // "") that wouldn't parse into a committed number yet.
    const [text, setText] = useState(value != null ? String(value) : "");

    useEffect(() => {
      setText(value != null ? String(value) : "");
    }, [value]);

    const onOverrideChange = useCallback(
      (
        _e?: React.FormEvent<HTMLElement | HTMLInputElement>,
        checked?: boolean
      ) => {
        if (checked) {
          const initial = typeof planValue === "number" ? planValue : 0;
          setText(String(initial));
          onChange(initial);
        } else {
          setText("");
          onChange(undefined);
        }
      },
      [onChange, planValue]
    );

    const onTextChange = useCallback(
      (
        _e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
        newValue?: string
      ) => {
        const nextText = newValue ?? "";
        setText(nextText);
        const parsed = Number(nextText);
        if (nextText.trim() !== "" && Number.isFinite(parsed)) {
          onChange(Math.trunc(parsed));
        }
      },
      [onChange]
    );

    return (
      <div className={styles.root}>
        <Checkbox
          label="Override"
          checked={overridden}
          disabled={disabled}
          onChange={onOverrideChange}
        />
        {overridden && (
          <TextField
            className={styles.input}
            type="number"
            value={text}
            disabled={disabled}
            onChange={onTextChange}
          />
        )}
      </div>
    );
  };

export default NumberFieldControl;
