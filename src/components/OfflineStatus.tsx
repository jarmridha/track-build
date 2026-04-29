import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineStatus() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className={online ? "hidden" : "sticky top-0 z-50 bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium flex items-center justify-center gap-2"}>
      {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      Offline mode: you can continue viewing cached pages. New submissions will need internet connection.
    </div>
  );
}
