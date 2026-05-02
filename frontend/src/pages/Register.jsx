import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "aws-amplify/auth";

// Cognito default password policy: min 8 chars, uppercase, lowercase, number, symbol
const validatePassword = (pw) => {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain a number.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Password must contain a symbol (e.g. ! @ # $).";
  return null;
};

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const showMsg = (text, type = "error") => setMessage({ text, type });

  const handleRegister = async () => {
    setMessage({ text: "", type: "" });

    // ── Validation ──────────────────────────────
    if (!email.trim() || !password || !confirmPw) {
      showMsg("All fields are required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showMsg("Please enter a valid email address.");
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) { showMsg(pwError); return; }
    if (password !== confirmPw) {
      showMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await signUp({
        username: email.trim().toLowerCase(),
        password,
        options: { userAttributes: { email: email.trim().toLowerCase() } },
      });
      showMsg("Account created! Check your email to verify, then sign in.", "success");
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      const code = err?.name;
      if (code === "UsernameExistsException") {
        showMsg("An account with this email already exists.");
      } else if (code === "InvalidPasswordException") {
        showMsg("Password does not meet the requirements.");
      } else {
        showMsg(err?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && handleRegister();

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>🔐</div>
        <h1 style={s.title}>Create Account</h1>
        <p style={s.sub}>Join SecureVault</p>

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
          autoComplete="new-password"
          disabled={loading}
        />
        <input
          style={s.input}
          type="password"
          placeholder="Confirm password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          onKeyDown={onKey}
          autoComplete="new-password"
          disabled={loading}
        />

        {/* Password hint */}
        <p style={s.hint}>
          Must be 8+ chars with uppercase, lowercase, number and symbol.
        </p>

        {message.text && (
          <div style={{
            ...s.msgBox,
            background: message.type === "success" ? "#052e16" : "#450a0a",
            color: message.type === "success" ? "#86efac" : "#fca5a5",
          }}>
            {message.type === "success" ? "✅ " : "❌ "}{message.text}
          </div>
        )}

        <button
          style={{ ...s.btn, opacity: loading ? 0.75 : 1 }}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>

        <p style={s.footer}>
          Already have an account?{" "}
          <Link to="/" style={s.link}>Sign in</Link>
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
  sub: { margin: "0 0 24px", fontSize: "14px", color: "#94a3b8" },
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
  hint: {
    fontSize: "12px",
    color: "#64748b",
    margin: "-4px 0 12px",
    textAlign: "left",
    lineHeight: "1.5",
  },
  msgBox: {
    fontSize: "13px",
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "12px",
    textAlign: "left",
    lineHeight: "1.5",
  },
  btn: {
    display: "block",
    width: "100%",
    padding: "12px",
    background: "#16a34a",
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