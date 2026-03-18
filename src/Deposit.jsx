import { useState, useEffect } from "react";

export default function Deposit({ onClose }) {
  const [selectedCoin, setSelectedCoin] = useState("USDT");
  const [network, setNetwork] = useState("TRC20");
  const [address, setAddress] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const walletData = {
    USDT: {
      networks: ["TRC20", "ERC20", "BEP20"],
      addresses: {
        TRC20: "TXnUhMVUBucf7sWDLUTkWT42XGDYqWEevm",
        ERC20: "0x1B481181F89C9acEDF3f121d93FAF6402F38aC56",
        BEP20: "0x1B481181F89C9acEDF3f121d93FAF6402F38aC56"
      }
    },
    BTC: {
      networks: ["Bitcoin"],
      addresses: { Bitcoin: "bc1qw0tq3lxeuxjn2n2waee3yvc62wece97xj592tt" }
    },
    ETH: {
      networks: ["ERC20", "Arbitrum"],
      addresses: {
        ERC20: "0x1B481181F89C9acEDF3f121d93FAF6402F38aC56",
        Arbitrum: "0x1B481181F89C9acEDF3f121d93FAF6402F38aC56"
      }
    },
    SOL: {
      networks: ["Solana"],
      addresses: { Solana: "8VWabHLjd3abNNtmgXfjHM3Cw1YEk1ZZdJSaH26wegQj" }
    },
    BNB: {
      networks: ["BEP20"],
      addresses: { BEP20: "0x1B481181F89C9acEDF3f121d93FAF6402F38aC56" }
    },
    DOGE: {
      networks: ["Dogecoin"],
      addresses: { Dogecoin: "D85nCeJiio2ioDDtd96XqrUGkFsNvqzM4j" }
    }
  };

  useEffect(() => {
    const coinData = walletData[selectedCoin];
    if (coinData) {
      if (!coinData.networks.includes(network)) {
        setNetwork(coinData.networks[0]);
        setAddress(coinData.addresses[coinData.networks[0]]);
      } else {
        setAddress(coinData.addresses[network]);
      }
    }
  }, [selectedCoin, network]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopyMsg("Copied!");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${address}`;
    link.download = `${selectedCoin}_Deposit_QR.png`;
    link.target = "_blank";
    link.click();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    // Logic to notify backend would go here
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Deposit notification sent! Please wait for network confirmation.");
      onClose();
    }, 1500);
  };

  // Styles
  const modalOverlay = {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center",
    alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)"
  };

  const modalContent = {
    background: "#1e2329", padding: "30px", borderRadius: "12px",
    width: "100%", maxWidth: "420px", border: "1px solid #2b3139", position: "relative",
    maxHeight: "90vh", overflowY: "auto"
  };

  const labelStyle = { color: "#848e9c", fontSize: "12px", marginBottom: "6px", display: "block" };
  const selectStyle = { 
    width: "100%", padding: "10px", background: "#0b0e11", border: "1px solid #474d57", 
    color: "#fff", borderRadius: "4px", marginBottom: "15px", outline: "none" 
  };

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <button onClick={onClose} style={{ position: "absolute", top: 15, right: 15, background: "none", border: "none", color: "#848e9c", fontSize: "20px", cursor: "pointer" }}>✕</button>
        
        <h2 style={{ marginTop: 0, color: "#fcd535", fontSize: "20px" }}>Deposit Crypto</h2>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Coin</label>
            <select style={selectStyle} value={selectedCoin} onChange={(e) => setSelectedCoin(e.target.value)}>
              {Object.keys(walletData).map(coin => <option key={coin} value={coin}>{coin}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Network</label>
            <select style={selectStyle} value={network} onChange={(e) => setNetwork(e.target.value)}>
              {walletData[selectedCoin].networks.map(net => <option key={net} value={net}>{net}</option>)}
            </select>
          </div>
        </div>

        {/* QR CODE SECTION */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ background: "#fff", padding: "10px", display: "inline-block", borderRadius: "8px" }}>
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${address}`} 
                    alt="Deposit QR"
                    style={{ display: "block", width: "160px", height: "160px" }}
                />
            </div>
            <div style={{ marginTop: "10px" }}>
              <button onClick={downloadQR} style={{ background: "transparent", border: "none", color: "#fcd535", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}>
                Save QR Code
              </button>
            </div>
        </div>

        {/* ADDRESS DISPLAY */}
        <div style={{ background: "#0b0e11", padding: "15px", borderRadius: "8px", border: "1px solid #2b3139", textAlign: "center", marginBottom: "20px" }}>
          <label style={{ ...labelStyle, fontSize: "10px", textTransform: "uppercase" }}>Your {selectedCoin} Address</label>
          <div style={{ color: "#fff", wordBreak: "break-all", fontWeight: "bold", margin: "8px 0", fontSize: "13px" }}>
            {address}
          </div>
          <button 
            onClick={copyToClipboard}
            style={{ background: "#fcd535", color: "#000", border: "none", padding: "10px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", width: "100%" }}
          >
            {copyMsg || "Copy Address"}
          </button>
        </div>

        <button 
          onClick={handleConfirm}
          disabled={isSubmitting}
          style={{ width: "100%", padding: "14px", background: "#0ecb81", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
        >
          {isSubmitting ? "Processing..." : "I have deposit the funds"}
        </button>

        <p style={{ color: "#848e9c", fontSize: "11px", textAlign: "center", marginTop: "15px" }}>
          * Deposits arrive after 3-6 network confirmations.
        </p>
      </div>
    </div>
  );
}