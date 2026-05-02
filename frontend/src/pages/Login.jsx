import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn } from "aws-amplify/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // SAFE LOGIN HANDLER
  // =========================
  const handleLogin = async () => {
    // ❌ INPUT VALIDATION (IMPORTANT)
    if (!email || !password) {
      setMessage("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const result = await signIn({
        username: email.trim(),
        password: password,
      });

      console.log("LOGIN SUCCESS:", result);

      navigate("/dashboard");

    } catch (error) {
      console.error("LOGIN ERROR:", error);

      // 🔥 SAFE ERROR HANDLING
      const msg =
        error?.message ||
        error?.name ||
        "Login failed";

      setMessage(msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1>🔐 SecureVault</h1>
        <p>Login to your account</p>

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          style={styles.button}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={{ marginTop: "10px", color: "red" }}>
          {message}
        </p>

        <p style={{ marginTop: "15px" }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

// =========================
// STYLES
// =========================
const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    background: "#1e293b",
    padding: "30px",
    borderRadius: "12px",
    width: "320px",
    textAlign: "center",
    color: "white",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
  },
  button: {
    width: "100%",
    padding: "10px",
    marginTop: "15px",
    background: "#2563eb",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};