import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("practice", "routes/practice.tsx"),
    route("practice/:word", "routes/practiceWord.tsx"),
  ]),
] satisfies RouteConfig;
