import { useState } from "react";
import { Text } from "@mantine/core";
import { text } from "../theme/typography";
import { KeyForm, KeyIntro } from "./account/keyForm";
import {
  CANCEL_ADMIN_KEY_REQUEST_INTENT,
  cancelRequest,
  REMOVE_INTENT,
  removeKey,
  saveKeyFromForm,
  SEND_ADMIN_KEY_REQUEST_INTENT,
  sendRequestFromForm,
} from "./account/keyActions";
import { RemoveKeySheet } from "./account/removeKeySheet";
import { SavedKeyCard } from "./account/savedKeyCard";
import {
  OwnKeyDivider,
  SharedKeyDeclinedCard,
  SharedKeyGrantedCard,
  SharedKeyPendingCard,
} from "./account/sharedKeyCard";
import { SharedKeyRequestSheet } from "./account/sharedKeyRequestSheet";
import { useLlmAccess } from "./account/useLlmAccess";
import type { Route } from "./+types/accountKey";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === REMOVE_INTENT) {
    await removeKey();
    return null;
  }
  if (intent === SEND_ADMIN_KEY_REQUEST_INTENT) {
    await sendRequestFromForm(formData);
    return null;
  }
  if (intent === CANCEL_ADMIN_KEY_REQUEST_INTENT) {
    await cancelRequest();
    return null;
  }
  return saveKeyFromForm(formData);
}

export default function AccountKeyRoute() {
  const access = useLlmAccess();
  const [isRemoveSheetOpen, setIsRemoveSheetOpen] = useState(false);
  const [isRequestSheetOpen, setIsRequestSheetOpen] = useState(false);
  const adminKeyRequest = access.adminKeyRequest;

  if (access.key !== null) {
    return (
      <>
        <SavedKeyCard
          savedKey={access.key}
          onRemove={() => setIsRemoveSheetOpen(true)}
        />
        <RemoveKeySheet
          isOpen={isRemoveSheetOpen}
          onClose={() => setIsRemoveSheetOpen(false)}
        />
      </>
    );
  }

  if (access.keySource === "admin") {
    return (
      <KeyForm
        isReplacing={false}
        header={
          <>
            <SharedKeyGrantedCard
              grantedAt={
                adminKeyRequest?.status === "approved"
                  ? adminKeyRequest.resolvedAt
                  : null
              }
            />
            <OwnKeyDivider />
            <Text {...text.bodyXs} c="dimmed">
              Saving your own key ends your access to the shared key.
            </Text>
          </>
        }
      />
    );
  }

  if (adminKeyRequest?.status === "pending") {
    return (
      <KeyForm
        isReplacing={false}
        header={
          <>
            <SharedKeyPendingCard request={adminKeyRequest} />
            <OwnKeyDivider />
          </>
        }
      />
    );
  }

  return (
    <>
      <KeyForm
        isReplacing={false}
        header={
          adminKeyRequest?.status === "declined" ? (
            <>
              <SharedKeyDeclinedCard request={adminKeyRequest} />
              <OwnKeyDivider />
            </>
          ) : (
            <KeyIntro />
          )
        }
        onRequestSharedKey={() => setIsRequestSheetOpen(true)}
      />
      <SharedKeyRequestSheet
        isOpen={isRequestSheetOpen}
        onClose={() => setIsRequestSheetOpen(false)}
      />
    </>
  );
}
