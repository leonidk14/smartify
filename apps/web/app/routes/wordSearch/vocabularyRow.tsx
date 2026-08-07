import { useCallback, useEffect, useRef } from "react";
import { Box, Divider, Text, UnstyledButton } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { type StoredMeaning, type VocabularyEntry } from "./vocabulary";
import { text } from "../../theme/typography";

const DELETE_WIDTH = 88;
const LONG_PRESS_MS = 450;

function firstMeaning(entry: VocabularyEntry): StoredMeaning | undefined {
  const group = entry.groups[0];
  if (!group) {
    return undefined;
  }
  return Object.values(group.meanings).sort((a, b) => a.order - b.order)[0];
}

function RowInner({ word, entry }: { word: string; entry: VocabularyEntry }) {
  const meaning = firstMeaning(entry);

  return (
    <>
      <Box
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          marginTop: 7,
          flex: "none",
          background: entry.shouldPracticeLater
            ? "var(--color-warning)"
            : "rgba(0,0,0,.2)",
        }}
      />
      <Box flex={1} miw={0}>
        <Text {...text.displaySm}>
          {entry.display ?? word}
          {entry.groups[0] ? (
            <Text {...text.annotation} span ml={6}>
              {entry.groups[0].part_of_speech}
            </Text>
          ) : null}
        </Text>
        {meaning ? (
          <Text {...text.bodyXs} c="dimmed" mt={2} lineClamp={1}>
            {meaning.definition}
          </Text>
        ) : null}
      </Box>
    </>
  );
}

interface VocabularyRowProps {
  word: string;
  entry: VocabularyEntry;
  showDivider: boolean;
  onOpenLookup: (query?: string) => void;
  onRequestDelete: (word: { key: string; display: string } | null) => void;
}

export function VocabularyRow({
  word,
  entry,
  showDivider,
  onOpenLookup,
  onRequestDelete,
}: VocabularyRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const didLongPressRef = useRef(false);
  const isOpenRef = useRef(false);

  const closeSelf = useCallback(() => {
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    isOpenRef.current = false;
  }, []);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearLongPress();
  }, [clearLongPress]);

  // Public words can't be deleted, so they render as a plain row with no swipe track.
  if (entry.isPublic) {
    return (
      <Box>
        {showDivider ? <Divider /> : null}
        <UnstyledButton
          onClick={() => onOpenLookup(word)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "12px 0",
            width: "100%",
          }}>
          <RowInner word={word} entry={entry} />
        </UnstyledButton>
      </Box>
    );
  }

  const openReveal = () => {
    trackRef.current?.scrollTo({ left: DELETE_WIDTH, behavior: "smooth" });
    isOpenRef.current = true;
  };

  const handlePointerDown = () => {
    didLongPressRef.current = false;
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      didLongPressRef.current = true;
      openReveal();
    }, LONG_PRESS_MS);
  };

  const handleScroll = () => {
    // A drag means this is a swipe, not a hold — cancel the pending long-press.
    clearLongPress();
    const isOpen = (trackRef.current?.scrollLeft ?? 0) > DELETE_WIDTH / 2;
    if (isOpen && !isOpenRef.current) {
      isOpenRef.current = true;
    } else if (!isOpen) {
      isOpenRef.current = false;
    }
  };

  const handleContentClick = () => {
    // A long-press ends in a click; swallow it. And let a tap on an open row close it
    // rather than opening the lookup.
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }
    if (isOpenRef.current) {
      closeSelf();
      return;
    }
    onOpenLookup(word);
  };

  return (
    <Box>
      {showDivider ? <Divider /> : null}
      <Box
        ref={trackRef}
        className="swipe-track"
        onScroll={handleScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
        }}>
        <UnstyledButton
          onPointerDown={handlePointerDown}
          onPointerUp={clearLongPress}
          onPointerCancel={clearLongPress}
          onPointerLeave={clearLongPress}
          onClick={handleContentClick}
          style={{
            flex: "0 0 100%",
            scrollSnapAlign: "start",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "12px 0",
          }}>
          <RowInner word={word} entry={entry} />
        </UnstyledButton>
        <UnstyledButton
          onClick={() =>
            onRequestDelete({ key: word, display: entry.display ?? "" })
          }
          aria-label={`Delete ${entry.display ?? word}`}
          style={{
            flex: `0 0 ${DELETE_WIDTH}px`,
            scrollSnapAlign: "end",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            background: "var(--color-text-error-strong)",
            color: "#fff",
          }}>
          <IconTrash size={18} />
          <Text {...text.bodySm} c="#fff">
            Delete
          </Text>
        </UnstyledButton>
      </Box>
    </Box>
  );
}
