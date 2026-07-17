import { useRouteLoaderData } from "react-router";
import type { Route } from "../+types/layout";

export function useVocabulary() {
  return useRouteLoaderData<Route.ComponentProps["loaderData"]>(
    "routes/layout",
  )!;
}
