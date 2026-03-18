import { useState } from "react";
import { motion } from "framer-motion";

export default function Login({ goRegister, setUser }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
  const [focused, setFocused] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg("Verifying security protocol...");

    try {
      const res = await fetch("http://localhost/backend/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setMsg("✅ Success. Redirecting...");
        if (setUser) setUser(data.user || true);
        setTimeout(() => {
          window.location.href = data.user?.role === "admin" ? "/admin" : "/dashboard";
        }, 1000);
      } else {
        setMsg("❌ " + (data.message || "Invalid credentials"));
      }
    } catch (err) {
      setMsg("❌ Network error. Check server status.");
    }
  };

  return (
    <div style={styles.container}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={styles.authCard}
      >
        <div style={styles.header}>
          <h1 style={styles.title}>Log In</h1>
          <p style={styles.subtitle}>Enter your account details to continue</p>
        </div>

        <form onSubmit={submit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username / Email</label>
            <input
              name="username"
              placeholder="Enter your username"
              onChange={handleChange}
              onFocus={() => setFocused("user")}
              onBlur={() => setFocused("")}
              required
              style={{
                ...styles.input,
                borderColor: focused === "user" ? "#F3BA2F" : "#474D57"
              }}
            />
          </div>

          <div style={styles.inputGroup}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label style={styles.label}>Password</label>
              <span style={styles.forgotText}>Forgot password?</span>
            </div>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              onChange={handleChange}
              onFocus={() => setFocused("pass")}
              onBlur={() => setFocused("")}
              required
              style={{
                ...styles.input,
                borderColor: focused === "pass" ? "#F3BA2F" : "#474D57"
              }}
            />
          </div>

          <motion.button 
            whileHover={{ backgroundColor: "#FCD535" }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            style={styles.mainButton}
          >
            Log In
          </motion.button>
        </form>

        {msg && (
          <div style={{
            ...styles.messageBox,
            color: msg.includes("✅") ? "#02C076" : "#CF304A"
          }}>
            {msg}
          </div>
        )}

        <div style={styles.divider}>
          <div style={styles.line}></div>
          <span style={styles.orText}>OR</span>
          <div style={styles.line}></div>
        </div>

        <div style={styles.footer}>
          <span style={{ color: "#848E9C" }}>Not a member?</span>
          <button type="button" style={styles.registerLink} onClick={goRegister}>
            Register Now
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#0B0E11", // Binance Dark Theme
    fontFamily: "'BinancePlex', -apple-system, sans-serif",
  },
  authCard: {
    background: "#181A20", // Binance Card color
    padding: "48px 40px",
    borderRadius: "16px",
    width: "420px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
  },
  header: {
    marginBottom: "32px",
    textAlign: "left",
  },
  title: {
    fontSize: "32px",
    fontWeight: "600",
    color: "#EAECEF",
    margin: "0 0 8px 0",
  },
  subtitle: {
    color: "#848E9C",
    fontSize: "14px",
    margin: 0,
  },
  inputGroup: {
    marginBottom: "24px",
    textAlign: "left",
  },
  label: {
    display: "block",
    color: "#EAECEF",
    fontSize: "14px",
    marginBottom: "8px",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid",
    background: "transparent",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box",
  },
  mainButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    background: "#F3BA2F", // Iconic Binance Yellow
    color: "#181A20",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "12px",
  },
  forgotText: {
    color: "#F3BA2F",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "500",
  },
  messageBox: {
    marginTop: "20px",
    fontSize: "14px",
    textAlign: "center",
    fontWeight: "500",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "30px 0",
  },
  line: {
    flex: 1,
    height: "1px",
    background: "#2B3139",
  },
  orText: {
    margin: "0 15px",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "600",
  },
  footer: {
    textAlign: "left",
    fontSize: "14px",
  },
  registerLink: {
    background: "none",
    border: "none",
    color: "#F3BA2F",
    fontWeight: "600",
    cursor: "pointer",
    marginLeft: "8px",
    padding: 0,
  },
};