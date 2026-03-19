import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [showChart, setShowChart] = useState(false); // State to toggle chart visibility
  const [prices, setPrices] = useState({
    bitcoin: { usd: 0, usd_24h_change: 0 },
    ethereum: { usd: 0, usd_24h_change: 0 },
    solana: { usd: 0, usd_24h_change: 0 },
    litecoin: { usd: 0, usd_24h_change: 0 },
  });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("https://bestcryptotrading.rf.gd/backend/api/get_prices.php");
        const data = await res.json();
        setPrices(data);
      } catch (err) {
        console.error("Price fetch error:", err);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.page}>
      {/* 🇺🇸 EXTRA BRIGHT USA FLAG WATERMARK */}
      <div style={styles.brightFlag}></div>

      <header style={styles.header}>
        <h2 style={styles.logo}>CRYPTO<span style={{ color: "#22c55e" }}>USA</span></h2>
        <div style={styles.navLinks}>
          <button style={styles.ghostBtn} onClick={() => navigate("/login")}>Login</button>
          <button style={styles.glowBtn} onClick={() => navigate("/register")}>Register</button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* 📊 VERTICAL PRICE COLUMN */}
        <aside style={styles.priceColumn}>
          <h4 style={styles.columnTitle}>Market Prices</h4>
          {Object.entries(prices).map(([name, data]) => (
            <motion.div whileHover={{ x: 5 }} key={name} style={styles.priceRow}>
              <span style={styles.coinName}>{name.toUpperCase()}</span>
              <span style={styles.coinPrice}>
                ${data.usd > 0 ? data.usd.toLocaleString() : "---"}
              </span>
              <span style={{ color: data.usd_24h_change >= 0 ? "#22c55e" : "#ef4444", fontSize: '11px' }}>
                {data.usd_24h_change >= 0 ? "▲" : "▼"} {Math.abs(data.usd_24h_change).toFixed(1)}%
              </span>
            </motion.div>
          ))}
        </aside>

        {/* 🎯 HERO SECTION & TRADING VIEW */}
        <main style={styles.heroSection}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span style={styles.topBadge}>🇺🇸 SECURE US-BASED TERMINAL</span>
            <h1 style={styles.mainTitle}>
              Trade with <span style={styles.gradientText}>Power</span>
            </h1>
            
            {/* 📈 CONDITIONALLY RENDERED TRADING VIEW WIDGET */}
            <AnimatePresence>
              {showChart && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={styles.chartContainer}
                >
                  <iframe
                    src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d4d&symbol=BINANCE:BTCUSDT&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en"
                    style={{ width: "100%", height: "400px", border: "none", borderRadius: "16px" }}
                    title="Live Chart"
                  ></iframe>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={styles.btnGroup}>
              <button style={styles.primaryBtn} onClick={() => navigate("/register")}>Open Account</button>
              
              {/* NEW TRADING VIEW TOGGLE BUTTON */}
              <button 
                style={showChart ? styles.activeBtn : styles.secondaryBtn} 
                onClick={() => setShowChart(!showChart)}
              >
                {showChart ? "Hide Trading View" : "Show Trading View"}
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#020617",
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  brightFlag: {
    position: "absolute",
    top: "5%",
    right: "-2%",
    width: "800px",
    height: "600px",
    backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg')`,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    opacity: 0.25,
    filter: "contrast(1.2) drop-shadow(0 0 80px rgba(59, 130, 246, 0.3))",
    zIndex: 0,
    pointerEvents: "none"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: "30px 60px",
    position: "relative",
    zIndex: 10
  },
  logo: { fontSize: "26px", fontWeight: "900", letterSpacing: "2px" },
  glowBtn: {
    background: "#22c55e",
    color: "#000",
    padding: "10px 30px",
    borderRadius: "10px",
    border: "none",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 0 30px rgba(34, 197, 94, 0.5)"
  },
  ghostBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", marginRight: "20px", fontWeight: "600" },
  layout: { display: "flex", padding: "0 60px", zIndex: 1, position: "relative", gap: "40px" },
  priceColumn: {
    width: "280px",
    background: "rgba(15, 23, 42, 0.6)",
    padding: "30px 20px",
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
  },
  columnTitle: { color: "#94a3b8", textTransform: "uppercase", fontSize: "11px", marginBottom: "20px", letterSpacing: "2px", textAlign: "center" },
  priceRow: {
    display: "flex",
    flexDirection: "column",
    padding: "18px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)"
  },
  coinName: { fontWeight: "900", color: "#64748b", fontSize: "12px" },
  coinPrice: { fontSize: "20px", margin: "4px 0", fontWeight: "700", fontFamily: "monospace" },
  heroSection: { flex: 1, paddingTop: "20px" },
  chartContainer: {
    marginTop: "30px",
    background: "rgba(0,0,0,0.5)",
    padding: "10px",
    borderRadius: "20px",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
    overflow: "hidden"
  },
  topBadge: { background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "8px 20px", borderRadius: "30px", fontSize: "12px", fontWeight: "bold", border: "1px solid rgba(34,197,94,0.3)" },
  mainTitle: { fontSize: "70px", fontWeight: "900", lineHeight: "1.1", margin: "20px 0" },
  gradientText: { background: "linear-gradient(to right, #22c55e, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  btnGroup: { marginTop: "40px", display: "flex", gap: "20px" },
  primaryBtn: { padding: "20px 45px", borderRadius: "14px", border: "none", background: "#fff", color: "#000", fontWeight: "900", cursor: "pointer", fontSize: "16px" },
  secondaryBtn: { padding: "20px 45px", borderRadius: "14px", border: "1px solid #334155", background: "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer", fontSize: "16px" },
  activeBtn: { padding: "20px 45px", borderRadius: "14px", border: "1px solid #22c55e", background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", cursor: "pointer", fontSize: "16px" }
};
