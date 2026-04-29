import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Upload, ImageOff } from "lucide-react";
import { toast } from "sonner";

type Doc = { id: string; name: string; storage_path: string; created_at: string };

export function ImagesSection({ projectId, canManage, userId }: { projectId: string; canManage: boolean; userId: string | null }) {
  const [images, setImages] = useState<(Doc & { url: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_documents")
      .select("id,name,storage_path,created_at")
      .eq("project_id", projectId)
      .eq("kind", "image")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const withUrls = (data ?? []).map(d => ({
      ...d,
      url: supabase.storage.from("project-images").getPublicUrl(d.storage_path).data.publicUrl,
    }));
    setImages(withUrls);
    setLoading(false);
  }

  useEffect(() => { load(); }, [projectId]);

  async function handleFiles(files: FileList | null, source: "camera" | "gallery" = "gallery") {
    if (!files || files.length === 0 || !userId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const safeName = file.name || `site-photo-${Date.now()}.jpg`;
        const path = `${projectId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("project-images").upload(path, file, { contentType: file.type });
        if (upErr) { toast.error(upErr.message); continue; }
        const { error: insErr } = await supabase.from("project_documents").insert({
          project_id: projectId, user_id: userId, kind: "image",
          name: source === "camera" ? `Camera photo - ${new Date().toLocaleString()}` : safeName,
          storage_path: path, mime_type: file.type, size_bytes: file.size,
        });
        if (insErr) toast.error(insErr.message);
      }
      toast.success(source === "camera" ? "Site photo uploaded" : "Images uploaded");
      await load();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  async function handleDelete(img: Doc) {
    const { error: stErr } = await supabase.storage.from("project-images").remove([img.storage_path]);
    if (stErr) toast.error(stErr.message);
    const { error } = await supabase.from("project_documents").delete().eq("id", img.id);
    if (error) return toast.error(error.message);
    toast.success("Image deleted");
    load();
  }

  return (
    <Card className="p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-lg">Site Photos</h2>
          <p className="text-xs text-muted-foreground">Capture directly from mobile camera or upload from gallery.</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFiles(e.target.files, "camera")} />
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files, "gallery")} />
            <Button size="sm" onClick={() => cameraInputRef.current?.click()} disabled={uploading}>
              <Camera className="mr-2 h-4 w-4" />Camera
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        )}
      </div>
      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : images.length === 0 ? (
        <div className="text-muted-foreground text-sm py-10 text-center flex flex-col items-center gap-2">
          <ImageOff className="h-8 w-8 opacity-50" />
          No site photos yet
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map(img => (
            <div key={img.id} className="group relative rounded-lg overflow-hidden border bg-muted aspect-square">
              <img src={img.url} alt={img.name} loading="lazy" className="w-full h-full object-cover" />
              {canManage && (
                <button
                  onClick={() => handleDelete(img)}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-background/90 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
