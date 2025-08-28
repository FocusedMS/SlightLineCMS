import { useState } from "react";

const API =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000";

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
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 16 }}>New Post</h1>

      {msg && (
        <div
          style={{
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            padding: 12,
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          {msg}
        </div>
      )}

      <label style={{ display: "block", marginBottom: 8 }}>Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 16,
        }}
      />

      <label style={{ display: "block", marginBottom: 8 }}>Excerpt</label>
      <input
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="Short summary (≤ 160 chars)"
        maxLength={160}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 16,
        }}
      />

      <label style={{ display: "block", marginBottom: 8 }}>Cover image</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        style={{ marginBottom: 8 }}
      />
      {coverImageUrl && (
        <div style={{ marginBottom: 16 }}>
          <img
            src={`${API}${coverImageUrl}`}
            alt="cover"
            style={{ maxWidth: "100%", borderRadius: 12 }}
          />
        </div>
      )}

      <label style={{ display: "block", marginBottom: 8 }}>Content (HTML)</label>
      <textarea
        value={contentHtml}
        onChange={(e) => setContentHtml(e.target.value)}
        rows={10}
        placeholder="<p>Write something...</p>"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 16,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        }}
      />

      <button
        onClick={handleSaveDraft}
        disabled={saving}
        style={{
          padding: "10px 16px",
          borderRadius: 12,
          border: "1px solid #0ea5e9",
          background: saving ? "#bae6fd" : "#38bdf8",
          color: "#0b1220",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {saving ? "Saving…" : "Save Draft"}
      </button>
    </div>
  );
}
