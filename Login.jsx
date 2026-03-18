import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [error, setError] = useState("");

  async function login() {
    const res = await fetch(
      "http://localhost/crypto-exchange/api_login.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }
    );

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data));
      onLogin(data);
    } else {
      setError("Login failed");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2>Exchange Login</h2>

        <input
          placeholder="Username"
          onChange={(e) => setUser(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPass(e.target.value)}
        />

        <button onClick={login}>Login</button>

        <p style={{ color: "red" }}>{error}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
  },
  box: {
    background: "#1e293b",
    padding: 30,
    borderRadius: 10,
    color: "white",
    width: 300,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
};
