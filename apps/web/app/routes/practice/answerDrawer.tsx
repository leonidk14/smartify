import { Text, Textarea, TextInput } from "@mantine/core";
import { BottomSheet } from "~/lib/bottomSheet";
import { text, textCss } from "~/theme/typography";

interface AnswerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inputVariant: "input" | "textarea";
  backdrop: "dimmed" | "readable";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
}

export const AnswerDrawer = ({
  isOpen,
  onClose,
  inputVariant,
  backdrop,
  placeholder,
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: AnswerDrawerProps) => {
  const boxedAppearance = {
    bd: "1.5px dashed rgba(0,0,0,.22)",
    bdrs: 14,
    styles: { input: { padding: "14px 15px", ...textCss.body } },
  };

  const singleLineAppearance = {
    size: "xl",
    style: { borderBottom: "2px solid var(--color-text)" },
    styles: { input: { paddingRight: 40 } },
  };

  const submitOnEnter = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      backdrop={backdrop}
      gap={12}
      primaryAction={{
        label: "Check",
        onClick: onSubmit,
        isDisabled: !value.trim(),
        isLoading: isSubmitting,
      }}>
      {inputVariant === "textarea" ? (
        <Textarea
          {...boxedAppearance}
          variant="unstyled"
          placeholder={placeholder}
          autosize
          minRows={2}
          maxRows={2}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={submitOnEnter}
          disabled={isSubmitting}
          autoComplete="off"
          enterKeyHint="send"
          data-autofocus
        />
      ) : (
        <TextInput
          {...singleLineAppearance}
          variant="unstyled"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={submitOnEnter}
          disabled={isSubmitting}
          autoComplete="off"
          type="search"
          enterKeyHint="send"
          data-autofocus
        />
      )}

      {errorMessage !== undefined ? (
        <Text {...text.bodySm} c="red">
          {errorMessage}
        </Text>
      ) : null}
    </BottomSheet>
  );
};
