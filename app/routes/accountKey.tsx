import { useState } from "react";
import { KeyForm } from "./account/keyForm";
import {
  REMOVE_INTENT,
  removeKey,
  saveKeyFromForm,
} from "./account/keyActions";
import { RemoveKeySheet } from "./account/removeKeySheet";
import { SavedKeyCard } from "./account/savedKeyCard";
import { useLlmAccess } from "./account/useLlmAccess";
import type { Route } from "./+types/accountKey";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  if (formData.get("intent") === REMOVE_INTENT) {
    await removeKey();
    return null;
  }
  return saveKeyFromForm(formData);
}

export default function AccountKeyRoute() {
  const access = useLlmAccess();
  const [isRemoveSheetOpen, setIsRemoveSheetOpen] = useState(false);

  if (access.key === null) {
    return <KeyForm isReplacing={false} />;
  }

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
