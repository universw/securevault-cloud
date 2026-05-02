import { useEffect, useState, useRef } from "react";
import { signOut, fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ||
  "https://0ny62nx51h.execute-api.us-east-1.amazonaws.com";

// ── Helpers ───────────────────────────────────────────────────
const fmtSize = (b) => {
  if (!b) return "—";
  const kb = b / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

const fileIcon = (name) => {
  const ext = name?.split(".").pop()?.toLowerCase();
  return { pdf: "📄", png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", webp: "🖼️",
    svg: "🖼️", mp4: "🎬", mov: "🎬", avi: "🎬", mp3: "🎵", wav: "🎵",
    zip: "🗜️", rar: "🗜️", "7z": "🗜️", doc: "📝", docx: "📝",
    xls: "📊", xlsx: "📊", csv: "📊", txt: "📃", json: "⚙️", js: "⚙️",
    ts: "⚙️", jsx: "⚙️", tsx: "⚙️",
  }[ext] || "📁";
};

const basename = (key) => key?.split("/").pop() || key || "unknown";

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // User
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);

  // Files
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [deletingKey, setDeletingKey] = useState(null);
  const [downloadingKey, setDownloadingKey] = useState(null);

  // Upload
  const [picked, setPicked] = useState(null);
  const [upStatus, setUpStatus] = useState("idle"); // idle|uploading|success|error
  const [upMsg, setUpMsg] = useState("");
  const [upPct, setUpPct] = useState(0);

  // UI
  const [tab, setTab] = useState("files"); // files|upload
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date"); // date|name|size

  // ── Boot ────────────────────────────────────────────────────
  useEffect(() => { loadUser(); }, []);
  useEffect(() => { if (userId) loadFiles(); }, [userId]);

  const loadUser = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken;
      if (!token?.payload) { navigate("/"); return; }
      setEmail(token.payload.email || "User");
      setUserId(token.payload.sub);   // unique Cognito user ID
    } catch { navigate("/"); }
  };

  // ── Load files ──────────────────────────────────────────────
  const loadFiles = async () => {
    try {
      setLoadingFiles(true);
      // Pass userId so Lambda lists only THIS user's folder
      const res = await fetch(`${API}/files?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to load files");
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : raw?.files ?? [];
      setFiles(list);
    } catch (e) {
      console.error(e);
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut().catch(console.error);
    navigate("/");
  };

  // ── Pick file ───────────────────────────────────────────────
  const handlePick = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) {
      setUpStatus("error");
      setUpMsg("File exceeds 50 MB limit.");
      return;
    }
    setPicked(f);
    setUpStatus("idle");
    setUpMsg("");
  };

  // ── Upload ──────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!picked) { setUpStatus("error"); setUpMsg("Choose a file first."); return; }

    try {
      setUpStatus("uploading");
      setUpMsg("Requesting upload URL…");
      setUpPct(15);

      const res = await fetch(`${API}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: picked.name,
          filetype: picked.type || "application/octet-stream",
          userId,          // Lambda stores under uploads/{userId}/filename
        }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");

      const raw = await res.json();
      const data = typeof raw.body === "string" ? JSON.parse(raw.body) : raw;
      const url = data?.uploadUrl;
      if (!url) throw new Error("No upload URL in response");

      setUpMsg("Uploading…");
      setUpPct(50);

      const put = await fetch(url, {
        method: "PUT",
        body: picked,
        headers: { "Content-Type": picked.type || "application/octet-stream" },
      });
      if (!put.ok) throw new Error("S3 upload failed");

      setUpPct(100);
      setUpStatus("success");
      setUpMsg(`"${picked.name}" uploaded!`);
      setPicked(null);
      if (fileRef.current) fileRef.current.value = "";

      await loadFiles();
      setTimeout(() => { setTab("files"); setUpStatus("idle"); setUpMsg(""); setUpPct(0); }, 1500);
    } catch (e) {
      console.error(e);
      setUpStatus("error");
      setUpMsg(e.message || "Upload failed.");
      setUpPct(0);
    }
  };

  // ── Download ─────────────────────────────────────────────────
  const handleDownload = async (key) => {
    try {
      setDownloadingKey(key);
      const res = await fetch(`${API}/download-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error("Failed to get download URL");
      const raw = await res.json();
      const data = typeof raw.body === "string" ? JSON.parse(raw.body) : raw;
      const url = data?.downloadUrl;
      if (!url) throw new Error("No download URL in response");

      // Force download via hidden <a>
      const a = Object.assign(document.createElement("a"), { href: url, download: basename(key) });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert(`Download failed: ${e.message}`);
    } finally {
      setDownloadingKey(null);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async (key) => {
    if (!confirm(`Delete "${basename(key)}"?\nThis cannot be undone.`)) return;
    try {
      setDeletingKey(key);
      const res = await fetch(`${API}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setFiles((prev) => prev.filter((f) => f.key !== key));
    } catch (e) {
      console.error(e);
      alert(`Delete failed: ${e.message}`);
    } finally {
      setDeletingKey(null);
    }
  };

  // ── Filter + sort ────────────────────────────────────────────
  const shown = files
    .filter((f) => basename(f.key).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name") return basename(a.key).localeCompare(basename(b.key));
      if (sort === "size") return (b.size || 0) - (a.size || 0);
      return new Date(b.lastModified || 0) - new Date(a.lastModified || 0);
    });

  const initials = email ? email[0].toUpperCase() : "?";

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={s.layout}>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={{ fontSize: "20px" }}>🔐</span>
          <span style={s.logoText}>SecureVault</span>
        </div>

        <nav style={s.nav}>
          {[
            { id: "files",  icon: "🗂️",  label: "My Files"  },
            { id: "upload", icon: "⬆️",  label: "Upload"    },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                ...s.navBtn,
                background: tab === id ? "#2563eb" : "transparent",
                color: tab === id ? "white" : "#94a3b8",
              }}
            >
              <span>{icon}</span><span>{label}</span>
            </button>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <div style={s.userRow}>
            <div style={s.avatar}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={s.userEmail}>{email}</p>
              <p style={s.userPlan}>Free Plan</p>
            </div>
          </div>
          <button onClick={handleLogout} style={s.logoutBtn}>Sign Out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>

        {/* Header */}
        <div style={s.header}>
          <h1 style={s.h1}>
            {tab === "files" ? "My Files" : "Upload a File"}
          </h1>
          <p style={s.h1sub}>
            {tab === "files"
              ? `${files.length} file${files.length !== 1 ? "s" : ""} stored securely`
              : "Add files to your personal vault"}
          </p>
        </div>

        {/* ── Files tab ── */}
        {tab === "files" && (
          <>
            <div style={s.toolbar}>
              <input
                style={s.search}
                placeholder="🔍  Search files…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select style={s.sortSel} value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="date">Newest first</option>
                <option value="name">Name A–Z</option>
                <option value="size">Largest first</option>
              </select>
            </div>

            <div style={s.card}>
              {loadingFiles ? (
                <div style={s.empty}><p>Loading…</p></div>
              ) : shown.length === 0 ? (
                <div style={s.empty}>
                  <p style={{ fontSize: "36px", margin: "0 0 10px" }}>📭</p>
                  <p style={{ color: "#64748b", margin: "0 0 16px" }}>
                    {search ? "No files match your search." : "Nothing here yet."}
                  </p>
                  {!search && (
                    <button style={s.primaryBtn} onClick={() => setTab("upload")}>
                      Upload your first file
                    </button>
                  )}
                </div>
              ) : (
                shown.map((f, i) => {
                  const name = basename(f.key);
                  const busy = deletingKey === f.key || downloadingKey === f.key;
                  return (
                    <div
                      key={f.key}
                      style={{
                        ...s.fileRow,
                        borderBottom: i < shown.length - 1 ? "1px solid #f1f5f9" : "none",
                        opacity: deletingKey === f.key ? 0.45 : 1,
                      }}
                    >
                      <span style={s.fileIcon}>{fileIcon(name)}</span>

                      <div style={s.fileInfo}>
                        <p style={s.fileName}>{name}</p>
                        <p style={s.fileMeta}>
                          {fmtSize(f.size)}{f.lastModified ? ` · ${fmtDate(f.lastModified)}` : ""}
                        </p>
                      </div>

                      <div style={s.actions}>
                        <button
                          style={{ ...s.actionBtn, ...s.dlBtn }}
                          disabled={busy}
                          onClick={() => handleDownload(f.key)}
                        >
                          {downloadingKey === f.key ? "…" : "⬇ Download"}
                        </button>
                        <button
                          style={{ ...s.actionBtn, ...s.delBtn }}
                          disabled={busy}
                          onClick={() => handleDelete(f.key)}
                        >
                          {deletingKey === f.key ? "…" : "🗑 Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── Upload tab ── */}
        {tab === "upload" && (
          <div style={s.card}>
            {/* Drop zone */}
            <div style={s.dropZone} onClick={() => fileRef.current?.click()}>
              <p style={{ fontSize: "44px", margin: "0 0 10px" }}>☁️</p>
              {picked ? (
                <>
                  <p style={{ fontWeight: "600", margin: "0 0 4px", color: "#0f172a" }}>{picked.name}</p>
                  <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>{fmtSize(picked.size)}</p>
                </>
              ) : (
                <>
                  <p style={{ fontWeight: "600", margin: "0 0 4px", color: "#0f172a" }}>Click to choose a file</p>
                  <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Max 50 MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handlePick} />

            {/* Progress bar */}
            {upStatus === "uploading" && (
              <div style={s.progressWrap}>
                <div style={{ ...s.progressBar, width: `${upPct}%` }} />
              </div>
            )}

            {/* Status message */}
            {upMsg && (
              <div style={{
                ...s.upMsg,
                background: upStatus === "success" ? "#f0fdf4" : upStatus === "error" ? "#fef2f2" : "#eff6ff",
                color:      upStatus === "success" ? "#16a34a" : upStatus === "error" ? "#dc2626" : "#2563eb",
                borderColor: upStatus === "success" ? "#bbf7d0" : upStatus === "error" ? "#fecaca" : "#bfdbfe",
              }}>
                {upMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", padding: "0 20px 20px" }}>
              <button
                style={{
                  ...s.primaryBtn,
                  flex: 1,
                  opacity: (!picked || upStatus === "uploading") ? 0.55 : 1,
                  cursor: (!picked || upStatus === "uploading") ? "not-allowed" : "pointer",
                }}
                onClick={handleUpload}
                disabled={!picked || upStatus === "uploading"}
              >
                {upStatus === "uploading" ? "Uploading…" : "Upload File"}
              </button>

              {picked && (
                <button
                  style={s.ghostBtn}
                  onClick={() => {
                    setPicked(null);
                    setUpMsg("");
                    setUpStatus("idle");
                    setUpPct(0);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  layout:  { display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" },
  sidebar: { width: "232px", background: "#0f172a", display: "flex", flexDirection: "column", flexShrink: 0 },
  logo:    { display: "flex", alignItems: "center", gap: "10px", padding: "22px 18px", borderBottom: "1px solid #1e293b" },
  logoText: { color: "white", fontWeight: "700", fontSize: "17px" },
  nav:     { padding: "14px 10px", display: "flex", flexDirection: "column", gap: "3px", flex: 1 },
  navBtn:  { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", textAlign: "left" },
  sidebarBottom: { padding: "14px", borderTop: "1px solid #1e293b" },
  userRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" },
  avatar:  { width: "34px", height: "34px", borderRadius: "50%", background: "#2563eb", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "13px", flexShrink: 0 },
  userEmail: { color: "white", fontSize: "12px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userPlan:  { color: "#475569", fontSize: "11px", margin: 0 },
  logoutBtn: { width: "100%", padding: "7px", background: "transparent", border: "1px solid #334155", borderRadius: "6px", color: "#94a3b8", cursor: "pointer", fontSize: "13px" },

  main:    { flex: 1, padding: "30px 32px", overflowY: "auto" },
  header:  { marginBottom: "22px" },
  h1:      { margin: "0 0 4px", fontSize: "22px", fontWeight: "700", color: "#0f172a" },
  h1sub:   { margin: 0, fontSize: "14px", color: "#64748b" },

  toolbar:  { display: "flex", gap: "10px", marginBottom: "14px" },
  search:   { flex: 1, padding: "9px 13px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none", background: "white" },
  sortSel:  { padding: "9px 13px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", background: "white", cursor: "pointer", outline: "none" },

  card:     { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" },
  empty:    { padding: "52px 24px", textAlign: "center", color: "#94a3b8" },

  fileRow:   { display: "flex", alignItems: "center", gap: "14px", padding: "13px 18px" },
  fileIcon:  { fontSize: "22px", width: "32px", textAlign: "center", flexShrink: 0 },
  fileInfo:  { flex: 1, minWidth: 0 },
  fileName:  { margin: "0 0 2px", fontSize: "14px", fontWeight: "500", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  fileMeta:  { margin: 0, fontSize: "12px", color: "#94a3b8" },
  actions:   { display: "flex", gap: "7px", flexShrink: 0 },
  actionBtn: { padding: "6px 13px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500" },
  dlBtn:     { background: "#eff6ff", color: "#2563eb" },
  delBtn:    { background: "#fef2f2", color: "#dc2626" },

  dropZone:    { margin: "20px 20px 14px", padding: "36px 20px", border: "2px dashed #e2e8f0", borderRadius: "10px", textAlign: "center", cursor: "pointer" },
  progressWrap: { margin: "0 20px 14px", height: "4px", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" },
  progressBar:  { height: "100%", background: "#2563eb", borderRadius: "2px", transition: "width 0.3s" },
  upMsg:        { margin: "0 20px 14px", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", border: "1px solid" },

  primaryBtn: { padding: "11px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  ghostBtn:   { padding: "11px 18px", background: "white", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", cursor: "pointer" },
};