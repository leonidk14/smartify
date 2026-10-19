import { Text } from "@mantine/core";
import { text } from "../../theme/typography";

export function KeyStorageNote() {
  return (
    <Text {...text.bodyXs} c="dimmed">
      Stored encrypted on our server and used only for your requests. Tip: give
      it its own workspace with a spend limit in the Anthropic console.
    </Text>
  );
}
