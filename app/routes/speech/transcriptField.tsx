import { Text, Textarea } from "@mantine/core";
import { text, textCss } from "../../theme/typography";
import { MAX_TRANSCRIPT_CHARACTERS } from "./speechConstants";
import { countCharacters } from "./speechTextRules";

interface TranscriptFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  shouldAutofocus?: boolean;
}

export function TranscriptField({
  value,
  onChange,
  placeholder,
  shouldAutofocus = false,
}: TranscriptFieldProps) {
  const characterCount = countCharacters(value);
  const isOverLimit = characterCount > MAX_TRANSCRIPT_CHARACTERS;

  return (
    <>
      <Textarea
        variant="unstyled"
        placeholder={placeholder}
        autosize
        minRows={8}
        bd="1.5px dashed rgba(0,0,0,.22)"
        bdrs={14}
        styles={{ input: { padding: "14px 15px", ...textCss.body } }}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        autoComplete="off"
        data-autofocus={shouldAutofocus || undefined}
      />

      <Text {...text.meta} ta="right" c={isOverLimit ? "red" : "dimmed"}>
        {characterCount} / {MAX_TRANSCRIPT_CHARACTERS}
      </Text>
    </>
  );
}
