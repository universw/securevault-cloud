import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn, signOut, fetchAuthSession } from "aws-amplify/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Auto-redirect if already logged in
  useEffect(() => {
    fetchAuthSession()
      .then((s) => {
        if (s?.tokens?.idToken) navigate("/dashboard", { replace: true });
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [navigate]);

  const handleLogin = async () => {
    setError("");
    const e = email.trim().toLowerCase();
    if (!e || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      // Clean any stale session before signing in (avoids "already signed in" error)
      await signOut().catch(() => {});
      await signIn({ username: e, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const code = err?.name;
      if (code === "NotAuthorizedException") setError("Incorrect email or password.");
      else if (code === "UserNotFoundException") setError("No account found with this email.");
      else if (code === "UserNotConfirmedException") setError("Please verify your email first.");
      else if (code === "TooManyRequestsException") setError("Too many attempts. Try again later.");
      else if (code === "NetworkError") setError("Network error. Check your connection.");
      else setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && !loading && handleLogin();

  // Loading state while checking existing session
  if (checking) {
    return (
      <div style={s.page}>
        <div style={{ color: "#94a3b8", fontSize: "15px" }}>
          🔐 Loading SecureVault...
        </div>
      </div>
    );
  }

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
          autoFocus
          disabled={loading}
        />

        <div style={s.passwordWrap}>
          <input
            style={{ ...s.input, paddingRight: "44px", marginBottom: 0 }}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey}
            autoComplete="current-password"
            disabled={loading}
          />
          <button
            type="button"
            style={s.eyeBtn}
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label="Toggle password visibility"
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        <button
          style={{ ...s.btn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
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
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "360px",
    background: "#1e293b",
    borderRadius: "16px",
    padding: "40px 32px",
    textAlign: "center",
    color: "white",
    boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
  },
  icon: { fontSize: "44px", marginBottom: "10px" },
  title: { margin: "0 0 4px", fontSize: "26px", fontWeight: 700 },
  sub: { margin: "0 0 28px", fontSize: "14px", color: "#94a3b8" },
  input: {
    display: "block",
    width: "100%",
    padding: "12px 14px",
    marginBottom: "12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "white",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },
  passwordWrap: { position: "relative", marginBottom: "12px" },
  eyeBtn: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 8px",
  },
  errorBox: {
    background: "#450a0a",
    color: "#fca5a5",
    fontSize: "13px",
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "12px",
    textAlign: "left",
    border: "1px solid #7f1d1d",
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
    fontWeight: 600,
    marginTop: "4px",
    transition: "opacity 0.2s",
  },
  footer: { marginTop: "22px", fontSize: "13px", color: "#94a3b8" },
  link: { color: "#60a5fa", textDecoration: "none", fontWeight: 500 },
};