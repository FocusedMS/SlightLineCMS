import { useState } from "react";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button";

const API =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:62816";

function getToken(): string {
  // Try common keys your app might use
  const direct = localStorage.getItem("token");
  if (direct) return direct;
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    if (auth?.token) return auth.token;
  } catch {}
  return "";
}

export default function NewPostPage() {
  const token = getToken();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!token) {
    return (
      <div style={{ padding: 24 }}>
        You’re not logged in. Please log in and try again.
      </div>
    );
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("File", file);   // matches backend [FromForm(Name = "file")] with swagger param "File"
      fd.append("Folder", "posts");
      const res = await fetch(`${API}/api/Media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Upload failed");
      }
      const data = await res.json();
      setCoverImageUrl(data.url);
      setMsg("Image uploaded ✅");
    } catch (err: any) {
      setMsg(`Upload error: ${err.message ?? err}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    setMsg(null);
    try {
      if (title.trim().length < 4) throw new Error("Title is too short");
      const body = {
        title,
        excerpt,
        contentHtml,
        coverImageUrl,
        focusKeyword: "", // optional
        // categoryId: undefined, // optional; backend accepts null/0
        // tagIds: [],            // optional
      };
      const res = await fetch(`${API}/api/Posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Save failed");
      }
      const data = await res.json();
      setMsg(`Saved draft ✅ (slug: ${data.slug})`);
    } catch (err: any) {
      setMsg(`Save error: ${err.message ?? err}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container py-6">
      <Card className="space-y-4">
        <h1 className="text-2xl font-semibold">New Post</h1>
        {msg && <div className="chip chip-neutral">{msg}</div>}

        <div className="space-y-2">
          <label className="label">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
        </div>

        <div className="space-y-2">
          <label className="label">Excerpt</label>
          <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary (≤ 160 chars)" maxLength={160} />
        </div>

        <div className="space-y-2">
          <label className="label">Cover image</label>
          <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
          {coverImageUrl && (
            <div>
              <img src={`${API}${coverImageUrl}`} alt="cover" className="rounded-xl max-w-full" loading="lazy" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="label">Content (HTML)</label>
          <textarea
            value={contentHtml}
            onChange={(e) => setContentHtml(e.target.value)}
            rows={10}
            placeholder="<p>Write something...</p>"
            className="w-full rounded-lg px-3 py-2 bg-[color:var(--surface)] border border-[color:var(--border)] text-[color:var(--text)] font-mono"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSaveDraft} disabled={saving}>{saving ? 'Saving…' : 'Save Draft'}</Button>
          <Button className="btn-ghost" variant="outline" onClick={() => setContentHtml('<p></p>')}>Clear</Button>
        </div>
      </Card>
    </div>
  );
}
