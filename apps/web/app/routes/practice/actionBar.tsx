import { Box } from "@mantine/core";

interface ActionBarProps {
  children: React.ReactNode;
}

export const ActionBar = ({ children }: ActionBarProps) => (
  <Box
    pos="fixed"
    bottom={0}
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
