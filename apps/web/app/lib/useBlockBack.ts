import { useEffect } from "react";
import { useBlocker } from "react-router";
import { notifications } from "@mantine/notifications";

export function useBlockBack(message: string) {
  const blocker = useBlocker(({ historyAction }) => historyAction === "POP");

  useEffect(() => {
    if (blocker.state !== "blocked") {
      return;
    }
    notifications.show({ id: "practice-block-back", message });
    blocker.reset();
  }, [blocker, message]);
}
