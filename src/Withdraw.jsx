import { useState } from "react";

export default function Withdraw({ onClose }) {
  // Use symbols for the state to match the 'currency' column and wallet checks
  const [symbol, setSymbol] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Map symbols to full names for your 'coin' column in the database
  const coinNameMap = {
    USDT: "tether",
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    LTC: "litecoin",
    DOGE: "dogecoin",
    TRX: "tron",
    XRP: "ripple"
  };

  const submitWithdraw = async () => {
    if (!amount || Number(amount) <= 0 || !address) {
      setMsg("Please enter a valid amount and wallet address.");
      return;
    }

    setLoading(true);
    setMsg("Processing request...");

    try {
      const res = await fetch(
        "https://bestcryptotrading.rf.gd/backend/api/withdraw.php", // Ensure filename matches your PHP
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: symbol,            // Becomes 'currency' in DB
            coin: coinNameMap[symbol], // Becomes 'coin' in DB (e.g. bitcoin)
            amount: parseFloat(amount),
            address: address,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setMsg("Withdrawal request submitted successfully!");
        setAmount("");
        setAddress("");
        // Optional: Auto-close after 2 seconds
        setTimeout(() => onClose(), 2000);
      } else {
        setMsg(data.message || "Withdrawal failed.");
      }
    } catch (err) {
      setMsg("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginTop: 0, color: "#fcd535" }}>Withdraw Assets</h3>

        <label style={labelStyle}>Select Asset</label>
        <select 
          style={inputStyle} 
          value={symbol} 
          onChange={(e) => setSymbol(e.target.value)}
        >
          <option value="USDT">USDT (Tether)</option>
          <option value="BTC">BTC (Bitcoin)</option>
          <option value="ETH">ETH (Ethereum)</option>
          <option value="SOL">SOL (Solana)</option>
          <option value="LTC">LTC (Litecoin)</option>
          <option value="TRX">TRX (Tron)</option>
        </select>

        <label style={labelStyle}>Recipient Wallet Address</label>
        <input
          style={inputStyle}
          placeholder="Enter destination address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <label style={labelStyle}>Withdraw Amount</label>
        <input
          style={inputStyle}
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button
          disabled={loading}
          style={{
            ...buttonStyle,
            background: loading ? "#474d57" : "#fcd535",
            cursor: loading ? "not-allowed" : "pointer"
          }}
          onClick={submitWithdraw}
        >
          {loading ? "Submitting..." : "Submit Withdrawal"}
        </button>

        {msg && (
          <p style={{ 
            marginTop: 15, 
            fontSize: "13px", 
            textAlign: "center",
            color: msg.includes("success") ? "#0ecb81" : "#f6465d" 
          }}>
            {msg}
          </p>
        )}

        <button style={closeButtonStyle} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* UI STYLES */
const overlayStyle = {
  position: "fixed",
  top: 0, left: 0,
  width: "100%", height: "100%",
  background: "rgba(0,0,0,0.85)",
  display: "flex", justifyContent: "center", alignItems: "center",
  zIndex: 1000
};

const modalStyle = {
  background: "#1e2329",
  padding: "30px",
  width: "380px",
  borderRadius: "12px",
  color: "#fff",
  boxShadow: "0px 10px 30px rgba(0,0,0,0.5)",
  border: "1px solid #2b3139"
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#848e9c",
  marginTop: "15px",
  marginBottom: "5px"
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  background: "#0b0e11",
  border: "1px solid #474d57",
  color: "#fff",
  borderRadius: "6px",
  boxSizing: "border-box",
  fontSize: "14px"
};

const buttonStyle = {
  width: "100%",
  marginTop: "25px",
  padding: "14px",
  color: "#000",
  fontWeight: "bold",
  border: "none",
  borderRadius: "6px",
  fontSize: "16px"
};

const closeButtonStyle = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  background: "transparent",
  color: "#848e9c",
  border: "none",
  cursor: "pointer",
  fontSize: "14px"
};
