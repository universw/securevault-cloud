import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn } from "aws-amplify/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await signIn({ username: email.trim().toLowerCase(), password });
      navigate("/dashboard");
    } catch (err) {
      const code = err?.name;
      if (code === "NotAuthorizedException") {
        setError("Incorrect email or password.");
      } else if (code === "UserNotFoundException") {
        setError("No account found with this email.");
      } else if (code === "UserNotConfirmedException") {
        setError("Please verify your email address first.");
      } else if (code === "TooManyRequestsException") {
        setError("Too many attempts. Please wait and try again.");
      } else {
        setError(err?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && handleLogin();

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>🔐</div>
        <h1 style={s.title}>SecureVault</h1>
        <p style={s.sub}>Sign in to your account</p>

        <input
          style={s.input}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onKey}
          autoComplete="email"
          disabled={loading}
        />
        <input
          style={s.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKey}
          autoComplete="current-password"
          disabled={loading}
        />

        {error && <div style={s.errorBox}>{error}</div>}

        <button
          style={{ ...s.btn, opacity: loading ? 0.75 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <p style={s.footer}>
          No account?{" "}
          <Link to="/register" style={s.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
  },
  card: {
    width: "340px",
    background: "#1e293b",
    borderRadius: "16px",
    padding: "40px 32px",
    textAlign: "center",
    color: "white",
    boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
  },
  icon: { fontSize: "42px", marginBottom: "10px" },
  title: { margin: "0 0 4px", fontSize: "24px", fontWeight: "700" },
  sub: { margin: "0 0 28px", fontSize: "14px", color: "#94a3b8" },
  input: {
    display: "block",
    width: "100%",
    padding: "11px 14px",
    marginBottom: "12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "white",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },
  errorBox: {
    background: "#450a0a",
    color: "#fca5a5",
    fontSize: "13px",
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "12px",
    textAlign: "left",
  },
  btn: {
    display: "block",
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
  },
  footer: { marginTop: "22px", fontSize: "13px", color: "#94a3b8" },
  link: { color: "#60a5fa", textDecoration: "none", fontWeight: "500" },
};