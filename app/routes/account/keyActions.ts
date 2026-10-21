import { notifications } from "@mantine/notifications";
import { readTextField } from "../../lib/formData";
import {
  cancelAdminKeyRequest,
  keySaveFailureMessage,
  removeLlmKey,
  saveLlmKey,
  sendAdminKeyRequest,
} from "./llmAccessApi";

export const REMOVE_INTENT = "remove";
export const SEND_ADMIN_KEY_REQUEST_INTENT = "send-request";
export const CANCEL_ADMIN_KEY_REQUEST_INTENT = "cancel-request";

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

export async function sendRequestFromForm(formData: FormData): Promise<void> {
  try {
    await sendAdminKeyRequest(readTextField(formData, "note"));
  } catch (error) {
    console.error("Failed to send the shared-key request", error);
    // TODO: map request failures (no connection, server error, known `code`s) to
    // user-facing messages in one place next to postFunction, for every call
    // site rather than per feature — separate MR.
    notifications.show({
      color: "red",
      message: "Couldn’t send the request — try again.",
    });
    return;
  }
  notifications.show({ message: "Request sent" });
}

export async function cancelRequest(): Promise<void> {
  try {
    await cancelAdminKeyRequest();
  } catch (error) {
    console.error("Failed to cancel the shared-key request", error);
    notifications.show({
      color: "red",
      message: "Couldn’t cancel the request — try again.",
    });
    return;
  }
  notifications.show({ message: "Request cancelled" });
}
