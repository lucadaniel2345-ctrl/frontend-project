import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom"; // Added useNavigate
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import AdminPanel from "./Admin";

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Initialize the navigator

  // Check session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(
          "https://bestcryptotrading.rf.gd/backend/api/checkSession.php",
          { credentials: "include" }
        );
        const data = await res.json();

        if (data.loggedIn) setUser(data.user);
        else setUser(null);
      } catch (err) {
        console.error("Session check failed:", err);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("https://bestcryptotrading.rf.gd/backend/api/logout.php", {
        credentials: "include",
      });
      setUser(null);
      localStorage.clear();
      navigate("/login"); // Smooth redirect after logout
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Login page: Now uses navigate() instead of href */}
        <Route
          path="/login"
          element={
            <Login
              setUser={setUser}
              goRegister={() => navigate("/register")} 
            />
          }
        />

        {/* Register page: Now uses navigate() instead of href */}
        <Route
          path="/register"
          element={<Register goLogin={() => navigate("/login")} />}
        />

        {/* User dashboard */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Login setUser={setUser} goRegister={() => navigate("/register")} />
            )
          }
        />

        {/* Admin panel */}
        <Route
          path="/admin"
          element={
            user && user.role === "admin" ? (
              <AdminPanel user={user} onLogout={handleLogout} />
            ) : (
              <Login setUser={setUser} goRegister={() => navigate("/register")} />
            )
          }
        />
      </Routes>
    </div>
  );
}
