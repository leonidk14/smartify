import { useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import {
  Anchor,
  Box,
  Button,
  CloseButton,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { text, textCss } from "../../theme/typography";
import { ActionBar } from "../practice/actionBar";
import { ANTHROPIC_CONSOLE_URL } from "./anthropicConsole";
import type { KeySaveFailure } from "./keyActions";
import { KeyStorageNote } from "./keyStorageNote";

interface StepProps {
  number: number;
  children: React.ReactNode;
}

function Step({ number, children }: StepProps) {
  return (
    <Group gap={10} wrap="nowrap" align="baseline">
      <Text {...text.label} c="var(--color-text)" w={16} flex="none">
        {number}
      </Text>
      <Text {...text.bodyXs}>{children}</Text>
    </Group>
  );
}

interface KeyFormProps {
  isReplacing: boolean;
}

export function KeyForm({ isReplacing }: KeyFormProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher<KeySaveFailure | null>();
  const [value, setValue] = useState("");

  const isChecking = fetcher.state !== "idle";
  const failure = fetcher.data?.failure;
  const hasValue = value.trim() !== "";

  const handleClear = () => {
    setValue("");
    fetcher.reset();
  };

  const handleSave = () => {
    void fetcher.submit({ key: value }, { method: "post" });
  };

  const handleCancel = () => {
    void navigate("/account/key", { replace: true });
  };

  return (
    <Stack gap={16} pb={240}>
      <Box>
        <Text {...text.displayMd}>Use your own Claude key</Text>
        <Text {...text.bodyXs} c="dimmed" mt={6}>
          Practice, Speech and lookups run on Claude. You pay Anthropic
          directly, usually a few cents a session.
        </Text>
      </Box>

      <Stack gap={9}>
        <Step number={1}>
          Open{" "}
          <Anchor
            href={ANTHROPIC_CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            c="inherit"
            underline="always">
            console.anthropic.com
          </Anchor>{" "}
          and sign in
        </Step>
        <Step number={2}>API keys → Create key, then copy it</Step>
        <Step number={3}>Paste it below</Step>
      </Stack>

      <Box>
        <TextInput
          aria-label="Claude API key"
          placeholder="sk-ant-…"
          size="md"
          radius={11}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          disabled={isChecking}
          error={failure}
          rightSectionPointerEvents="all"
          rightSection={
            hasValue && !isChecking ? (
              <CloseButton aria-label="Clear key" onClick={handleClear} />
            ) : null
          }
          styles={{
            input: { fontFamily: "var(--font-family-mono)" },
            error: { ...textCss.bodyXs, color: "var(--color-text-error)" },
          }}
        />
        {isChecking ? (
          <Group gap={6} mt={8}>
            <Loader size={10} color="gray" />
            <Text {...text.label}>Checking with Anthropic…</Text>
          </Group>
        ) : null}
      </Box>

      <ActionBar>
        <Stack gap={10}>
          <Button
            fullWidth
            h={48}
            radius={13}
            color="black"
            disabled={!hasValue}
            loading={isChecking}
            onClick={handleSave}>
            Save key
          </Button>
          {isReplacing ? (
            <Button
              variant="subtle"
              color="dark"
              disabled={isChecking}
              onClick={handleCancel}>
              Cancel
            </Button>
          ) : null}
          <KeyStorageNote />
        </Stack>
      </ActionBar>
    </Stack>
  );
}
