import React, { useCallback } from "react";
import { Checkbox, Toggle } from "@fluentui/react";
import styles from "./BooleanFieldControl.module.css";

export interface BooleanFieldControlProps {
  /** Current override value; `undefined` means "not overridden, inherit from plan". */
  value: boolean | undefined;
  /** Effective plan value, used as the starting value when override is turned on. */
  planValue: unknown;
  disabled?: boolean;
  onChange: (value: boolean | undefined) => void;
}

const BooleanFieldControl: React.VFC<BooleanFieldControlProps> =
  function BooleanFieldControl({ value, planValue, disabled, onChange }) {
    const overridden = value !== undefined;

    const onOverrideChange = useCallback(
      (
        _e?: React.FormEvent<HTMLElement | HTMLInputElement>,
        checked?: boolean
      ) => {
        onChange(checked ? Boolean(planValue) : undefined);
      },
      [onChange, planValue]
    );

    const onValueChange = useCallback(
      (_e: React.MouseEvent<HTMLElement>, checked?: boolean) => {
        onChange(Boolean(checked));
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
          <Toggle
            className={styles.toggle}
            checked={value}
            onText="Enabled"
            offText="Disabled"
            disabled={disabled}
            onChange={onValueChange}
          />
        )}
      </div>
    );
  };

export default BooleanFieldControl;
