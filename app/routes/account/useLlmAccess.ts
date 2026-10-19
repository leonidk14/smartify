import { useRouteLoaderData } from "react-router";
import type { Route } from "../+types/account";

export function useLlmAccess() {
  const data =
    useRouteLoaderData<Route.ComponentProps["loaderData"]>("routes/account");
  if (!data) {
    throw new Error("No loader data available for the route 'routes/account'");
  }
  return data;
}
