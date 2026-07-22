import { Box } from "@mantine/core";
import { useKeyboardInset } from "../../lib/useKeyboardInset";

interface ActionBarProps {
  children: React.ReactNode;
}

export const ActionBar = ({ children }: ActionBarProps) => {
  const keyboardInset = useKeyboardInset();

  return (
    <Box
      pos="fixed"
      bottom={keyboardInset}
      left={0}
      right={0}
      px={16}
      pt={32}
      pb={16}
      style={{
        background:
          "linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff 16px)",
      }}>
      {children}
    </Box>
  );
};
