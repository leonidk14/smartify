import { useState } from "react";
import {
  Box,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAuth } from "./authContext";
import { BottomSheet } from "./bottomSheet";
import { text, textCss } from "../theme/typography";

const labelStyles = { label: { ...textCss.label, marginBottom: 5 } };

export function SignInDrawer() {
  const { isSignInOpen, closeSignIn, signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value) ? null : "Enter a valid email",
      password: (value) => (value.length > 0 ? null : "Enter your password"),
    },
  });

  const handleClose = () => {
    form.reset();
    setFormError(null);
    closeSignIn();
  };

  const handleSubmit = form.onSubmit(async ({ email, password }) => {
    setIsSubmitting(true);
    setFormError(null);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    notifications.show({ message: "Signed in" });
    form.reset();
  });

  return (
    <BottomSheet isOpen={isSignInOpen} onClose={handleClose}>
      <Box>
        <Title order={1}>Sign In</Title>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack gap={11}>
          <TextInput
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
            size="md"
            radius={12}
            styles={labelStyles}
            {...form.getInputProps("email")}
          />
          <PasswordInput
            size="md"
            placeholder="password"
            radius={12}
            styles={labelStyles}
            {...form.getInputProps("password")}
          />

          {formError ? (
            <Text {...text.bodySm} c="var(--color-text-error)">
              {formError}
            </Text>
          ) : null}

          <Button
            type="submit"
            fullWidth
            size="md"
            radius={13}
            mt={4}
            loading={isSubmitting}>
            Sign in
          </Button>
        </Stack>
      </form>
    </BottomSheet>
  );
}
