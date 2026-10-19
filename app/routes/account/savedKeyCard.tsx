import { Link } from "react-router";
import { Anchor, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { IconArrowUpRight } from "@tabler/icons-react";
import { text } from "../../theme/typography";
import { ActionBar } from "../practice/actionBar";
import { ANTHROPIC_BILLING_URL, ANTHROPIC_KEYS_URL } from "./anthropicConsole";
import { KeyStorageNote } from "./keyStorageNote";
import type { SavedLlmKey } from "./llmAccessApi";

function formatSavedDate(savedAt: string): string {
  const date = new Date(savedAt);
  const isThisYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(isThisYear ? {} : { year: "numeric" }),
  });
}

const REPLACE_PATH = "/account/key/replace";

interface SavedKeyCardProps {
  savedKey: SavedLlmKey;
  onRemove: () => void;
}

export function SavedKeyCard({ savedKey, onRemove }: SavedKeyCardProps) {
  const isRejected = savedKey.status === "rejected";
  const statusColor = isRejected
    ? "var(--color-text-error)"
    : "var(--color-text-success)";

  return (
    <Stack gap={16} pb={isRejected ? 150 : 0}>
      <Paper
        radius={15}
        p={15}
        bd={`1.5px solid ${isRejected ? "var(--color-text-error)" : "rgba(0,0,0,.12)"}`}>
        <Stack gap={11}>
          <Group justify="space-between" wrap="nowrap">
            <Text {...text.uiLabel}>Claude API key</Text>
            <Text {...text.label} c={statusColor}>
              ● {isRejected ? "Not working" : "Working"}
            </Text>
          </Group>
          <Text
            {...text.meta}
            c="var(--color-text)"
            bg="var(--color-surface-warm)"
            bdrs={9}
            px={12}
            py={11}>
            sk-ant-•••• •••• {savedKey.hint}
          </Text>
          {isRejected ? (
            <Text {...text.bodyXs}>
              Anthropic stopped accepting this key. It may have been revoked or
              disabled.
            </Text>
          ) : (
            <>
              <Text {...text.label}>
                Added {formatSavedDate(savedKey.savedAt)}
              </Text>
              <Group gap={8} grow>
                <Button
                  component={Link}
                  to={REPLACE_PATH}
                  replace
                  variant="outline"
                  color="dark"
                  h={38}
                  radius={13}>
                  Replace
                </Button>
                <Button
                  variant="outline"
                  color="dark"
                  h={38}
                  radius={13}
                  onClick={onRemove}>
                  Remove
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Paper>

      {isRejected ? (
        <ActionBar>
          <Stack gap={10}>
            <Button
              component="a"
              href={ANTHROPIC_KEYS_URL}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              h={48}
              radius={13}
              color="black"
              rightSection={<IconArrowUpRight size={16} />}>
              Open Anthropic console
            </Button>
            <Button
              component={Link}
              to={REPLACE_PATH}
              replace
              variant="subtle"
              color="dark">
              Use a different key
            </Button>
          </Stack>
        </ActionBar>
      ) : (
        <>
          <KeyStorageNote />
          <Anchor
            href={ANTHROPIC_BILLING_URL}
            target="_blank"
            rel="noopener noreferrer"
            underline="never"
            c="var(--color-text)">
            <Group
              justify="space-between"
              wrap="nowrap"
              py={12}
              style={{
                borderTop: "1px solid var(--color-border)",
                borderBottom: "1px solid var(--color-border)",
              }}>
              <Text {...text.bodySm}>Manage billing at Anthropic</Text>
              <IconArrowUpRight
                size={16}
                style={{ color: "rgba(0,0,0,.35)" }}
              />
            </Group>
          </Anchor>
        </>
      )}
    </Stack>
  );
}
