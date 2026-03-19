import { useState } from "react";
import { motion } from "framer-motion";

export default function Register({ goLogin }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("Processing registration...");

    try {
      const res = await fetch("http://bestcryptotrading.rf.gd/backend/api/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Success! Redirecting to login...");
        setTimeout(() => goLogin(), 2000);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Connection failed.");
    }
  };

  return (
    <div style={styles.page}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={styles.container}
      >
        {/* Binance Style Header */}
        <h1 style={styles.mainTitle}>Create Your Account</h1>
        <p style={styles.subText}>Register with your email or username</p>

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputField}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={form.username}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputField}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
              value={form.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputField}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <motion.button 
            whileHover={{ backgroundColor: "#fcd535" }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            style={styles.yellowBtn}
          >
            Create Personal Account
          </motion.button>
        </form>

        {message && (
          <p style={{ 
            marginTop: 20, 
            fontSize: "14px", 
            textAlign: "left",
            color: message.includes("✅") ? "#02c076" : "#cf304a" 
          }}>
            {message}
          </p>
        )}

        <div style={styles.footer}>
          <span style={{ color: "#848e9c" }}>Already registered?</span>
          <button onClick={goLogin} style={styles.loginLink}>Log In</button>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0b0e11", // Deepest background
    fontFamily: "BinancePlex, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  container: {
    backgroundColor: "#181a20", // Card background
    padding: "40px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "450px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  mainTitle: {
    fontSize: "32px",
    fontWeight: "600",
    color: "#eaecef",
    marginBottom: "8px",
    textAlign: "left",
  },
  subText: {
    color: "#848e9c",
    fontSize: "14px",
    marginBottom: "32px",
    textAlign: "left",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputField: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    color: "#eaecef",
    fontSize: "14px",
    fontWeight: "500",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #474d57",
    background: "transparent",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    "&:focus": {
      borderColor: "#f3ba2f",
    }
  },
  yellowBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    background: "#f3ba2f", // Binance Yellow
    color: "#181a20",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },
  footer: {
    marginTop: "32px",
    fontSize: "14px",
    textAlign: "left",
  },
  loginLink: {
    background: "none",
    border: "none",
    color: "#f3ba2f",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "500",
    marginLeft: "8px",
  },
};
