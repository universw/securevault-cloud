import React, { useEffect, useState } from "react";
import { signOut, fetchAuthSession } from "aws-amplify/auth";
import { useNavigate, Link } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const API_URL =
    "https://0ny62nx51h.execute-api.us-east-1.amazonaws.com";

  const [email, setEmail] = useState("Loading...");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    loadUser();
    loadFiles();
  }, []);

  // =========================
  // SAFE AUTH FIX
  // =========================
  const loadUser = async () => {
    try {
      const session = await fetchAuthSession();

      console.log("SESSION DEBUG:", session);

      const idToken = session?.tokens?.idToken;

      if (!idToken || !idToken.payload) {
        console.log("No valid session");
        setEmail("Guest");
        return;
      }

      const email = idToken.payload.email;

      setEmail(email || "User");
    } catch (error) {
      console.error("AUTH ERROR:", error);
      setEmail("Guest");
    }
  };

  // =========================
  // SAFE FILES LOAD
  // =========================
  const loadFiles = async () => {
    try {
      setLoadingFiles(true);

      const response = await fetch(`${API_URL}/files`);
      const data = await response.json();

      console.log("FILES RESPONSE:", data);

      // SAFE normalization
      const normalized =
        Array.isArray(data)
          ? data
          : data?.files
          ? data.files
          : [];

      setFiles(normalized);
    } catch (error) {
      console.error("FILES ERROR:", error);
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    }
  };

  // =========================
  // FILE SELECT
  // =========================
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadMessage("");
  };

  // =========================
  // FIXED UPLOAD (STRICT VERSION)
  // =========================
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please choose a file.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadMessage("Getting upload URL...");

      const response = await fetch(`${API_URL}/upload-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          filetype: selectedFile.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const raw = await response.json();
      console.log("UPLOAD RAW RESPONSE:", raw);

      // SAFE parsing (STRICT)
      const data =
        typeof raw.body === "string"
          ? JSON.parse(raw.body)
          : raw;

      const uploadUrl = data?.uploadUrl;

      if (!uploadUrl) {
        throw new Error("Backend did not return uploadUrl");
      }

      setUploadMessage("Uploading...");

      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
      });

      if (!uploadResult.ok) {
        throw new Error("S3 upload failed");
      }

      setUploadMessage("✅ Upload successful!");
      setSelectedFile(null);

      const input = document.querySelector('input[type="file"]');
      if (input) input.value = "";

      await loadFiles();

    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      setUploadMessage(`❌ ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // =========================
  // FORMAT SIZE
  // =========================
  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";

    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;

    return `${(kb / 1024).toFixed(2)} MB`;
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>🔐 SecureVault</h2>

        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/dashboard">My Files</Link>
          <Link to="/dashboard">Upload</Link>
          <Link to="/dashboard">Settings</Link>
        </nav>

        <button
          onClick={handleLogout}
          style={{
            marginTop: "20px",
            padding: "10px",
            background: "#dc2626",
            color: "white",
            borderRadius: "8px",
            width: "100%",
          }}
        >
          Logout
        </button>
      </aside>

      <main className="main-content">
        <header>
          <h1>Welcome Back</h1>
          <p>{email}</p>
        </header>

        <section style={{
          background: "white",
          padding: "20px",
          borderRadius: "14px",
          marginBottom: "25px",
        }}>
          <h3>Upload File</h3>

          <input type="file" onChange={handleFileChange} />

          {selectedFile && <p>📄 {selectedFile.name}</p>}

          <button
            onClick={handleUpload}
            disabled={isUploading}
            style={{
              marginTop: "12px",
              padding: "10px",
              background: "#2563eb",
              color: "white",
              borderRadius: "8px",
              width: "200px",
            }}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>

          <p>{uploadMessage}</p>
        </section>

        <section style={{
          background: "white",
          padding: "20px",
          borderRadius: "14px",
        }}>
          <h3>My Files</h3>

          {loadingFiles ? (
            <p>Loading files...</p>
          ) : files.length === 0 ? (
            <p>No files uploaded yet.</p>
          ) : (
            files.map((file, index) => (
              <div key={index} style={{
                padding: "12px",
                borderBottom: "1px solid #eee",
              }}>
                <strong>
                  {file.key?.replace("uploads/", "")}
                </strong>

                <p>{formatSize(file.size)}</p>

                <p>
                  {file.lastModified
                    ? new Date(file.lastModified).toLocaleString()
                    : ""}
                </p>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;