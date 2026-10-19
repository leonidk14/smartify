import { matchPath, useNavigation } from "react-router";

export function useIsNavigatingTo(pattern: string): boolean {
  const navigation = useNavigation();
  return (
    navigation.state === "loading" &&
    matchPath(pattern, navigation.location.pathname) !== null
  );
}
