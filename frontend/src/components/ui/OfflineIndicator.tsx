import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-50 bg-amber-500 text-white text-center py-1.5 text-xs font-medium flex items-center justify-center gap-1.5"
      role="alert"
    >
      <WifiOff size={14} />
      Brak połączenia z internetem
    </div>
  );
}
