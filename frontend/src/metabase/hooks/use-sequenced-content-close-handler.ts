import { useCallback, useRef } from "react";
import _ from "underscore";

type PopoverData = {
  contentEl: Element;
  close: () => void;
};

export const RENDERED_POPOVERS: PopoverData[] = [];

function isElement(a: any): a is Element {
  return a instanceof Element;
}

function isEventOutsideOfElement(e: Event, el: Element) {
  return isElement(e.target) && !el.contains(e.target);
}

export function removePopoverData(popoverData: PopoverData) {
  const index = RENDERED_POPOVERS.indexOf(popoverData);
  if (index >= 0) {
    RENDERED_POPOVERS.splice(index, 1);
  }
}

export function shouldClosePopover(
  e: MouseEvent | KeyboardEvent,
  popoverData: PopoverData,
) {
  const mostRecentPopover = _.last(RENDERED_POPOVERS);

  if (e instanceof MouseEvent) {
    return (
      mostRecentPopover &&
      mostRecentPopover === popoverData &&
      isEventOutsideOfElement(e, mostRecentPopover.contentEl)
    );
  }

  if (e instanceof KeyboardEvent) {
    return (
      mostRecentPopover &&
      mostRecentPopover === popoverData &&
      e.key === "Escape"
    );
  }

  console.warn("Unsupported event type", e);
  return false;
}

export default function useSequencedContentCloseHandler() {
  const popoverDataRef = useRef<PopoverData>();

  const handleEvent = useCallback((e: MouseEvent | KeyboardEvent) => {
    if (
      popoverDataRef.current &&
      shouldClosePopover(e, popoverDataRef.current)
    ) {
      popoverDataRef.current.close();
    }
  }, []);

  const removeCloseHandler = useCallback(() => {
    if (popoverDataRef.current) {
      removePopoverData(popoverDataRef.current);
      popoverDataRef.current = undefined;
    }

    document.removeEventListener("mousedown", handleEvent, true);
    document.removeEventListener("keydown", handleEvent);
  }, [handleEvent]);

  const setupCloseHandler = useCallback(
    (contentEl: Element | null, close: () => void) => {
      removeCloseHandler();

      if (isElement(contentEl)) {
        const popover = { contentEl, close };
        RENDERED_POPOVERS.push(popover);
        popoverDataRef.current = popover;

        document.addEventListener("mousedown", handleEvent, true);
        window.addEventListener("keydown", handleEvent);
      }
    },
    [handleEvent, removeCloseHandler],
  );

  return { setupCloseHandler, removeCloseHandler };
}
