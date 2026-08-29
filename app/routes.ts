import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";
import { IS_SPEECH_ENABLED } from "./featureFlags";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    ...((IS_SPEECH_ENABLED as boolean)
      ? [
          route("speech", "routes/speech.tsx"),
          route("speech/record", "routes/speechRecord.tsx"),
          route("speech/:id", "routes/speechRecording.tsx"),
        ]
      : []),
    route("practice", "routes/practice.tsx"),
    route("practice/select", "routes/practiceSelect.tsx"),
    route("practice/preview", "routes/practicePreview.tsx"),
    route("practice/session", "routes/practiceSession.tsx"),
    route("practice/summary", "routes/practiceSummary.tsx"),
    route("practice/:word", "routes/practiceWord.tsx"),
    route("practice/:word/sentence", "routes/practiceSentence.tsx"),
  ]),
] satisfies RouteConfig;
