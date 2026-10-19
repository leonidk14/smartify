import { notifications } from "@mantine/notifications";
import { readTextField } from "../../lib/formData";
import {
  keySaveFailureMessage,
  removeLlmKey,
  saveLlmKey,
} from "./llmAccessApi";

export const REMOVE_INTENT = "remove";

export interface KeySaveFailure {
  failure: string;
}

export async function saveKeyFromForm(
  formData: FormData,
): Promise<KeySaveFailure | null> {
  try {
    await saveLlmKey(readTextField(formData, "key"));
  } catch (error) {
    return { failure: keySaveFailureMessage(error) };
  }
  notifications.show({ message: "Key saved" });
  return null;
}

export async function removeKey(): Promise<void> {
  try {
    await removeLlmKey();
  } catch (error) {
    console.error("Failed to remove the API key", error);
    notifications.show({
      color: "red",
      message: "Couldn’t remove the key — try again.",
    });
    return;
  }
  notifications.show({ message: "Key removed" });
}
