import { supabase } from "@/integrations/supabase/client";

const QUEUE_KEY = "trackbuild_offline_queue_v1";

export type OfflineQueueItem = {
  id: string;
  type: "daily_update";
  payload: Record<string, unknown>;
  createdAt: string;
  status: "pending" | "synced" | "failed";
  error?: string;
};

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(items: OfflineQueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("offline-queue-changed"));
}

export function addOfflineDailyUpdate(payload: Record<string, unknown>) {
  const items = getOfflineQueue();
  const item: OfflineQueueItem = {
    id: crypto.randomUUID(),
    type: "daily_update",
    payload,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  saveOfflineQueue([item, ...items]);
  return item;
}

export async function syncOfflineQueue() {
  const items = getOfflineQueue();
  const pending = items.filter(item => item.status === "pending" || item.status === "failed");
  if (!navigator.onLine || pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const nextItems: OfflineQueueItem[] = [];

  for (const item of items) {
    if (item.status !== "pending" && item.status !== "failed") {
      nextItems.push(item);
      continue;
    }

    try {
      if (item.type === "daily_update") {
        const { error } = await supabase.from("daily_updates").insert(item.payload as any);
        if (error) throw error;
        const progress = Number(item.payload.progress_percent ?? 0);
        const projectId = String(item.payload.project_id ?? "");
        if (projectId && progress > 0) {
          await supabase.from("projects").update({ progress }).eq("id", projectId);
        }
      }
      synced += 1;
    } catch (error: any) {
      failed += 1;
      nextItems.push({ ...item, status: "failed", error: error?.message ?? "Sync failed" });
    }
  }

  saveOfflineQueue(nextItems);
  return { synced, failed };
}
