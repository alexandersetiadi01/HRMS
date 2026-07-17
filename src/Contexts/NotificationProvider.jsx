import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  dismissNotification,
  fetchNotifications,
  fetchNotificationSummary,
  fetchUnreadNotificationSources,
  markNotificationRead,
  markNotificationSourceRead,
  markNotificationTypesRead,
} from "../API/notification";
import NotificationContext from "./NotificationContext";

const REFRESH_INTERVAL_MS = 60 * 1000;

const EMPTY_SUMMARY = Object.freeze({
  total: 0,
  sections: {
    home: 0,
    attendance: 0,
    payroll: 0,
  },
  shortcuts: {
    clock: 0,
    payroll: 0,
    announcement: 0,
    "latest-news": 0,
    "to-do-list": 0,
    "sticky-note": 0,
  },
  menu_dots: {
    home: false,
    attendance: false,
    payroll: false,
  },
});

function normalizeCount(value) {
  const count = Number(value || 0);

  return Number.isFinite(count) && count > 0
    ? Math.floor(count)
    : 0;
}

function normalizeSummary(summary) {
  return {
    total: normalizeCount(summary?.total),
    sections: {
      home: normalizeCount(summary?.sections?.home),
      attendance: normalizeCount(
        summary?.sections?.attendance,
      ),
      payroll: normalizeCount(summary?.sections?.payroll),
    },
    shortcuts: {
      clock: normalizeCount(summary?.shortcuts?.clock),
      payroll: normalizeCount(summary?.shortcuts?.payroll),
      announcement: normalizeCount(
        summary?.shortcuts?.announcement,
      ),
      "latest-news": normalizeCount(
        summary?.shortcuts?.["latest-news"],
      ),
      "to-do-list": normalizeCount(
        summary?.shortcuts?.["to-do-list"],
      ),
      "sticky-note": normalizeCount(
        summary?.shortcuts?.["sticky-note"],
      ),
    },
    menu_dots: {
      home: Boolean(summary?.menu_dots?.home),
      attendance: Boolean(summary?.menu_dots?.attendance),
      payroll: Boolean(summary?.menu_dots?.payroll),
    },
  };
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message
    || error?.response?.data?.data?.message
    || error?.message
    || "Unable to load notifications."
  );
}

export default function NotificationProvider({
  employeeId,
  children,
}) {
  const normalizedEmployeeId = Number(employeeId || 0);

  const [notifications, setNotifications] = useState([]);
  const [unreadSources, setUnreadSources] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);

  const refreshNotifications = useCallback(async ({
    silent = false,
  } = {}) => {
    if (!normalizedEmployeeId) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!silent) {
      setLoading(true);
    }

    const [
      summaryResult,
      notificationsResult,
      unreadSourcesResult,
    ] = await Promise.allSettled([
      fetchNotificationSummary(),
      fetchNotifications({
        page: 1,
        per_page: 20,
      }),
      fetchUnreadNotificationSources(),
    ]);

    if (requestId !== requestIdRef.current) {
      return;
    }

    const errors = [];

    if (summaryResult.status === "fulfilled") {
      setSummary(
        normalizeSummary(summaryResult.value),
      );
    } else {
      errors.push(summaryResult.reason);
    }

    if (notificationsResult.status === "fulfilled") {
      const items = notificationsResult.value?.items;

      setNotifications(
        Array.isArray(items) ? items : [],
      );
    } else {
      errors.push(notificationsResult.reason);
    }

    if (unreadSourcesResult.status === "fulfilled") {
      const items = unreadSourcesResult.value?.items;

      setUnreadSources(
        Array.isArray(items) ? items : [],
      );
    } else {
      errors.push(unreadSourcesResult.reason);
    }

    setError(
      errors.length
        ? getErrorMessage(errors[0])
        : "",
    );

    setLoading(false);
  }, [normalizedEmployeeId]);

  const markAsRead = useCallback(async (
    notificationId,
  ) => {
    const normalizedId = Number(
      notificationId || 0,
    );

    if (!normalizedId) {
      return null;
    }

    const updatedNotification = (
      await markNotificationRead(normalizedId)
    );

    await refreshNotifications({
      silent: true,
    });

    return updatedNotification;
  }, [refreshNotifications]);

  const markTypesAsRead = useCallback(async (
    notificationTypes,
  ) => {
    const normalizedTypes = Array.from(
      new Set(
        (
          Array.isArray(notificationTypes)
            ? notificationTypes
            : []
        )
          .map((type) => String(type || "").trim())
          .filter(Boolean),
      ),
    );

    if (normalizedTypes.length === 0) {
      return null;
    }

    try {
      const result = await markNotificationTypesRead(
        normalizedTypes,
      );

      await refreshNotifications({
        silent: true,
      });

      return result;
    } catch (markError) {
      setError(getErrorMessage(markError));
      throw markError;
    }
  }, [refreshNotifications]);

  const markSourceAsRead = useCallback(async (
    sourceType,
    sourceId,
  ) => {
    const normalizedType = String(
      sourceType || "",
    ).trim();

    const normalizedId = Number(sourceId || 0);

    if (!normalizedType || !normalizedId) {
      return null;
    }

    const result = await markNotificationSourceRead(
      normalizedType,
      normalizedId,
    );

    await refreshNotifications({
      silent: true,
    });

    return result;
  }, [refreshNotifications]);

  const dismiss = useCallback(async (
    notificationId,
  ) => {
    const normalizedId = Number(
      notificationId || 0,
    );

    if (!normalizedId) {
      return null;
    }

    const result = await dismissNotification(
      normalizedId,
    );

    await refreshNotifications({
      silent: true,
    });

    return result;
  }, [refreshNotifications]);

  const unreadSourceKeys = useMemo(() => {
    return new Set(
      unreadSources.map((item) => {
        const sourceType = String(
          item?.source_type || "",
        );

        const sourceId = Number(
          item?.source_id || 0,
        );

        return `${sourceType}:${sourceId}`;
      }),
    );
  }, [unreadSources]);

  const isSourceUnread = useCallback((
    sourceType,
    sourceId,
  ) => {
    const normalizedType = String(
      sourceType || "",
    ).trim();

    const normalizedId = Number(sourceId || 0);

    if (!normalizedType || !normalizedId) {
      return false;
    }

    return unreadSourceKeys.has(
      `${normalizedType}:${normalizedId}`,
    );
  }, [unreadSourceKeys]);

  useEffect(() => {
    requestIdRef.current += 1;

    if (!normalizedEmployeeId) {
      return undefined;
    }

    const initialRefreshId = window.setTimeout(
      () => {
        refreshNotifications();
      },
      0,
    );

    const handleFocus = () => {
      refreshNotifications({
        silent: true,
      });
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        refreshNotifications({
          silent: true,
        });
      }
    };

    const intervalId = window.setInterval(
      () => {
        if (
          document.visibilityState === "visible"
        ) {
          refreshNotifications({
            silent: true,
          });
        }
      },
      REFRESH_INTERVAL_MS,
    );

    window.addEventListener(
      "focus",
      handleFocus,
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      requestIdRef.current += 1;

      window.clearTimeout(initialRefreshId);
      window.clearInterval(intervalId);

      window.removeEventListener(
        "focus",
        handleFocus,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [
    normalizedEmployeeId,
    refreshNotifications,
  ]);

  const value = useMemo(() => ({
    notifications,
    unreadSources,
    summary,
    totalUnread: summary.total,
    unreadSections: summary.sections,
    shortcutCounts: summary.shortcuts,
    menuDots: summary.menu_dots,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markTypesAsRead,
    markSourceAsRead,
    dismissNotification: dismiss,
    isSourceUnread,
  }), [
    dismiss,
    error,
    isSourceUnread,
    loading,
    markAsRead,
    markSourceAsRead,
    markTypesAsRead,
    notifications,
    refreshNotifications,
    summary,
    unreadSources,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}