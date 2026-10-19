import { Navigate } from "react-router";
import { defaultAccountTab } from "./account/accountTabs";
import { useLlmAccess } from "./account/useLlmAccess";

// Not a redirect() in the parent loader: that would start a fresh navigation
// from the previous screen and fetch the access summary a second time.
export default function AccountIndexRoute() {
  const access = useLlmAccess();
  return <Navigate to={`/account/${defaultAccountTab(access)}`} replace />;
}
