import React from "react";
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
} from "@fluentui/react";

export interface BlockerDialogProps {
  hidden: boolean;
  title: string;
  subText: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onDismiss?: () => void;
}

const BlockerDialog: React.VFC<BlockerDialogProps> = function BlockerDialog({
  hidden,
  title,
  subText,
  confirmText = "Leave",
  cancelText = "Stay",
  onConfirm,
  onDismiss,
}) {
  return (
    <Dialog
      hidden={hidden}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.normal,
        title,
        subText,
      }}
    >
      <DialogFooter>
        <PrimaryButton text={confirmText} onClick={onConfirm} />
        <DefaultButton text={cancelText} onClick={onDismiss} />
      </DialogFooter>
    </Dialog>
  );
};

export default BlockerDialog;
