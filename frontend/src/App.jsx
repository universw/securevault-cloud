import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// ──────────────────────────────────────────────
// Protected Route — blocks unauthenticated users
// ──────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    fetchAuthSession()
      .then((session) => {
        const valid = !!session?.tokens?.idToken;
        setStatus(valid ? "auth" : "unauth");
      })
      .catch(() => setStatus("unauth"));
  }, []);

  if (status === "checking") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#94a3b8",
        fontSize: "16px",
        gap: "10px",
      }}>
        <span style={{ fontSize: "24px" }}>🔐</span> Loading SecureVault...
      </div>
    );
  }

  return status === "auth" ? children : <Navigate to="/" replace />;
}

// ──────────────────────────────────────────────
// App
// ──────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}