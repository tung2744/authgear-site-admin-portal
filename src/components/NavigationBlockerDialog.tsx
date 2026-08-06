import React, { useCallback, useEffect, useState } from "react";
import { Location, useBlocker, useNavigate } from "react-router-dom";
import BlockerDialog from "./BlockerDialog";
import { shouldBlockNavigation } from "./navigationBlockerPredicate";

export interface NavigationBlockerDialogProps {
  // Always-fresh dirty check, called at the exact moment a navigation is
  // attempted. A plain boolean prop would only be as fresh as the last
  // render -- a save() can clear dirtiness and then immediately navigate
  // away (e.g. right after a successful save) before React has re-rendered
  // this component with the updated value, causing this dialog to show
  // spuriously right after a successful save.
  getIsDirty: () => boolean;
  onConfirmNavigation?: () => void;
}

const NavigationBlockerDialog: React.VFC<NavigationBlockerDialogProps> =
  function NavigationBlockerDialog({ getIsDirty, onConfirmNavigation }) {
    const navigate = useNavigate();

    const [dialogState, setDialogState] = useState<{
      visible: boolean;
      destination?: Location;
    }>({ visible: false });

    const blocker = useBlocker(
      useCallback(
        ({ nextLocation }: { nextLocation: Location }) => {
          const blocked = shouldBlockNavigation({
            isDirty: getIsDirty(),
            dialogVisible: dialogState.visible,
          });
          if (blocked) {
            setDialogState({ visible: true, destination: nextLocation });
          }
          return blocked;
        },
        [getIsDirty, dialogState.visible]
      )
    );

    useEffect(() => {
      // Ensure the router's blocked transition is released on unmount.
      return () => {
        if (blocker.state === "blocked") blocker.reset();
      };
    }, [blocker]);

    const onDialogDismiss = useCallback(() => {
      // Release the router's blocked transition. Otherwise the navigation
      // stays blocked even after this dialog is hidden, and the very next
      // navigation attempt can find the router still stuck mid-transition.
      if (blocker.state === "blocked") {
        blocker.reset();
      }
      setDialogState({ visible: false });
    }, [blocker]);

    const onDialogConfirm = useCallback(() => {
      const { destination } = dialogState;
      if (destination != null) {
        navigate(destination, { state: destination.state });
        onConfirmNavigation?.();
      }
      setDialogState({ visible: false });
    }, [navigate, dialogState, onConfirmNavigation]);

    return (
      <BlockerDialog
        hidden={!dialogState.visible}
        title="Discard unsaved changes?"
        subText="You have unsaved changes. If you leave this page, your changes will be lost."
        confirmText="Leave"
        cancelText="Stay"
        onConfirm={onDialogConfirm}
        onDismiss={onDialogDismiss}
      />
    );
  };

export default NavigationBlockerDialog;
