import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useNotifications from "../../Contexts/UseNotification";

export default function NotificationRouteReadTracker() {
  const { pathname } = useLocation();
  const { markTypesAsRead } = useNotifications();

  useEffect(() => {
    if (pathname !== "/attendance/clock") {
      return undefined;
    }

    let active = true;

    async function markClockOutRemindersRead() {
      try {
        await markTypesAsRead([
          "clock_out_reminder",
        ]);
      } catch {
        if (!active) {
          return;
        }
      }
    }

    markClockOutRemindersRead();

    return () => {
      active = false;
    };
  }, [markTypesAsRead, pathname]);

  return null;
}