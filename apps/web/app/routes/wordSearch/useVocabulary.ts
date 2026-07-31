import { useRouteLoaderData } from "react-router";
import type { Route } from "../+types/layout";

export function useVocabulary() {
  const data =
    useRouteLoaderData<Route.ComponentProps["loaderData"]>("routes/layout");
  if (!data) {
    throw new Error("No loader data available for the route 'routes/layout'");
  }
  return data;
}
