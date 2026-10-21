import { replace } from "react-router";
import { KeyForm, KeyIntro } from "./account/keyForm";
import { saveKeyFromForm } from "./account/keyActions";
import type { Route } from "./+types/accountKeyReplace";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const failure = await saveKeyFromForm(await request.formData());
  return failure ?? replace("/account/key");
}

export default function AccountKeyReplaceRoute() {
  return <KeyForm isReplacing header={<KeyIntro />} />;
}
