import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Doc = { id: string; name: string; storage_path: string; mime_type: string | null; size_bytes: number | null; created_at: string };

function formatBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsSection({ projectId, canManage, userId }: { projectId: string; canManage: boolean; userId: string | null }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_documents")
      .select("id,name,storage_path,mime_type,size_bytes,created_at")
      .eq("project_id", projectId)
      .eq("kind", "document")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setDocs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [projectId]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !userId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("project-documents").upload(path, file, { contentType: file.type });
        if (upErr) { toast.error(upErr.message); continue; }
        const { error: insErr } = await supabase.from("project_documents").insert({
          project_id: projectId, user_id: userId, kind: "document",
          name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size,
        });
        if (insErr) toast.error(insErr.message);
      }
      toast.success("Documents uploaded");
      await load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDownload(doc: Doc) {
    const { data, error } = await supabase.storage.from("project-documents").createSignedUrl(doc.storage_path, 60);
    if (error || !data) return toast.error(error?.message || "Failed to get link");
    window.open(data.signedUrl, "_blank");
  }

  async function handleDelete(doc: Doc) {
    await supabase.storage.from("project-documents").remove([doc.storage_path]);
    const { error } = await supabase.from("project_documents").delete().eq("id", doc.id);
    if (error) return toast.error(error.message);
    toast.success("Document deleted");
    load();
  }

  return (
    <Card className="p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Documents</h2>
        {canManage && (
          <>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : "Upload"}
            </Button>
          </>
        )}
      </div>
      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="text-muted-foreground text-sm py-10 text-center flex flex-col items-center gap-2">
          <FileText className="h-8 w-8 opacity-50" />
          No documents yet
        </div>
      ) : (
        <ul className="divide-y">
          {docs.map(d => (
            <li key={d.id} className="flex items-center gap-3 py-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatBytes(d.size_bytes)} · {format(new Date(d.created_at), "MMM d, yyyy")}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDownload(d)}><Download className="h-4 w-4" /></Button>
              {canManage && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
