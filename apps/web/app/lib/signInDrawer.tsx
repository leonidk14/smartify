import { useState } from "react";
import {
  Box,
  Button,
  Drawer,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAuth } from "./auth";
import { useKeyboardInset } from "./useKeyboardInset";

const labelStyles = {
  label: {
    fontFamily: "var(--mantine-font-family-monospace)",
    textTransform: "uppercase" as const,
    fontSize: 10,
    letterSpacing: ".5px",
    fontWeight: 500,
    color: "var(--mantine-color-dimmed)",
    marginBottom: 5,
  },
};

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

  const keyboardInset = useKeyboardInset();

  return (
    <Drawer
      opened={isSignInOpen}
      onClose={handleClose}
      position="bottom"
      size={300 + keyboardInset}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.35 }}
      radius={0}
      styles={{
        content: { borderRadius: "24px 24px 0 0" },
        body: { padding: "18px 22px 26px" },
      }}>
      <Stack gap={16}>
        <Box>
          <Title order={2} fw={400} style={{ fontSize: 24, lineHeight: 1.1 }}>
            Welcome back
          </Title>
          <Text size="sm" c="dimmed" mt={5}>
            Sign in to look up words and practice.
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack gap={11}>
            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="alex@example.com"
              size="md"
              radius={12}
              styles={labelStyles}
              {...form.getInputProps("email")}
            />
            <PasswordInput
              label="Password"
              autoComplete="current-password"
              size="md"
              radius={12}
              styles={labelStyles}
              {...form.getInputProps("password")}
            />

            {formError ? (
              <Text size="sm" c="var(--color-text-error)">
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
      </Stack>
    </Drawer>
  );
}
