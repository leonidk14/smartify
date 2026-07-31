import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("practice", "routes/practice.tsx"),
    route("practice/select", "routes/practiceSelect.tsx"),
    route("practice/session", "routes/practiceSession.tsx"),
    route("practice/summary", "routes/practiceSummary.tsx"),
    route("practice/:word", "routes/practiceWord.tsx"),
    route("practice/:word/sentence", "routes/practiceSentence.tsx"),
  ]),
] satisfies RouteConfig;
