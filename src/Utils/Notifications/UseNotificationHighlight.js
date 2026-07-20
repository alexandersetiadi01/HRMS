import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

function getHighlightId(search) {
  const searchParams = new URLSearchParams(search);
  const highlightId = Number(
    searchParams.get("highlight") || 0,
  );

  if (
    !Number.isInteger(highlightId)
    || highlightId <= 0
  ) {
    return 0;
  }

  return highlightId;
}

export default function useNotificationHighlight() {
  const location = useLocation();
  const navigate = useNavigate();

  const [highlightedId, setHighlightedId] = useState(
    () => getHighlightId(location.search),
  );

  const clearHighlight = useCallback(() => {
    setHighlightedId(0);
  }, []);

  useEffect(() => {
    const nextHighlightId = getHighlightId(
      location.search,
    );

    if (!nextHighlightId) {
      return;
    }

    setHighlightedId(nextHighlightId);

    const nextSearchParams = new URLSearchParams(
      location.search,
    );

    nextSearchParams.delete("highlight");

    const nextSearch = nextSearchParams.toString();

    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
        hash: location.hash,
      },
      {
        replace: true,
        state: location.state,
      },
    );
  }, [
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);

  useEffect(() => {
    if (!highlightedId) {
      return undefined;
    }

    let listenerAttached = false;

    const handlePointerDown = () => {
      clearHighlight();
    };

    const timeoutId = window.setTimeout(() => {
      document.addEventListener(
        "pointerdown",
        handlePointerDown,
        {
          capture: true,
          once: true,
        },
      );

      listenerAttached = true;
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);

      if (listenerAttached) {
        document.removeEventListener(
          "pointerdown",
          handlePointerDown,
          true,
        );
      }
    };
  }, [clearHighlight, highlightedId]);

  return {
    highlightedId,
    clearHighlight,
  };
}