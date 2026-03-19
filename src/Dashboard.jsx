import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Deposit from "./Deposit";
import LiveChart from "./LiveChart";
import ProfitChart from "./ProfitChart";
import Withdraw from "./Withdraw";

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();

  /* ================= STATE MANAGEMENT ================= */
  const [activePage, setActivePage] = useState("dashboard");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRecentHistory, setShowRecentHistory] = useState(true); // Toggle for Recent Trade History

  /* ================= KYC STATES ================= */
  const [kycStatus, setKycStatus] = useState(user?.kyc_status || "unverified"); 
  const [idFile, setIdFile] = useState(null); 
  const [selfieFile, setSelfieFile] = useState(null); 
  const [kycMsg, setKycMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  /* ================= DATA STATES ================= */
  const [wallets, setWallets] = useState([]);
  const [trades, setTrades] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [allPrices, setAllPrices] = useState({});

  /* ================= CONVERT STATES ================= */
  const [fromCoin, setFromCoin] = useState("USDT");
  const [toCoin, setToCoin] = useState("BTC");
  const [convertAmount, setConvertAmount] = useState("");
  const [convertMsg, setConvertMsg] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [swapHistory, setSwapHistory] = useState([]);
  const [showConvertHistory, setShowConvertHistory] = useState(false);

  /* ================= SUPPORT STATES ================= */
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportMessage, setSupportMessage] = useState("");

  /* ================= TRADE STATES ================= */
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [price, setPrice] = useState(0);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [loadingTrade, setLoadingTrade] = useState(false);
  const [tick, setTick] = useState(0);

  const timeframeProfitMap = {
    "30s": { profit: 20, seconds: 30 },
    "60s": { profit: 30, seconds: 60 },
    "120s": { profit: 40, seconds: 120 },
    "1h": { profit: 47, seconds: 3600 },
    "12h": { profit: 67, seconds: 43200 },
  };

  const [timeframe, setTimeframe] = useState("30s");

  const coinIdMap = {
    "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana",
    "LTC": "litecoin", "DOGE": "dogecoin", "BNB": "binancecoin",
    "XRP": "ripple", "ADA": "cardano", "TRX": "tron", "USDT": "tether"
  };

  /* ================= GATEKEEPER FUNCTION ================= */
  const checkAccess = (actionName) => {
    if (user?.role === 'admin') return true;
    if (kycStatus === 'verified') return true;
    
    setKycMsg(`Please complete identity verification to access ${actionName}.`);
    setActivePage("kyc");
    return false;
  };

  /* ================= DATA LOADING ================= */
  const loadData = useCallback(async () => {
    try {
      const resW = await fetch("http://bestcryptotrading.rf.gd/backend/api/get_wallets.php", { credentials: "include" });
      const dataW = await resW.json();
      
      const resP = await fetch("http://bestcryptotrading.rf.gd/backend/api/get_prices.php");
      const prices = await resP.json();
      setAllPrices(prices);

      if (dataW.success) {
        setWallets(dataW.wallets);
        if (prices[selectedCoin]) setPrice(prices[selectedCoin].usd);

        let total = 0;
        dataW.wallets.forEach(w => {
          const symbol = w.coin.toUpperCase();
          const balance = Number(w.balance) || 0;
          if (["USD", "USDT", "USDC"].includes(symbol)) {
            total += balance;
          } else {
            const apiId = coinIdMap[symbol];
            if (apiId && prices[apiId]?.usd) {
              total += balance * prices[apiId].usd;
            }
          }
        });
        setTotalUsd(total);
      }

      const resT = await fetch("http://bestcryptotrading.rf.gd/backend/api/get_user_trades.php", { credentials: "include" });
      const dataT = await resT.json();
      if (dataT.success) setTrades(dataT.trades);

      const resWith = await fetch("http://bestcryptotrading.rf.gd/backend/api/get_withdrawals.php", { credentials: "include" });
      const dataWith = await resWith.json();
      if (dataWith.success) setWithdrawals(dataWith.withdrawals);

      const resUser = await fetch("http://bestcryptotrading.rf.gd/backend/api/get_user_status.php", { credentials: "include" });
      const dataUser = await resUser.json();
      if (dataUser.success) setKycStatus(dataUser.kyc_status);

    } catch (err) {
      console.error("Data Load Error:", err);
    }
  }, [selectedCoin]);

  useEffect(() => {
    loadData();
    if (activePage === "convert") loadSwapHistory();
    if (activePage === "support") fetchChatHistory();

    const timer = setInterval(() => setTick(t => t + 1), 1000);
    const sync = setInterval(async () => {
      try {
        const response = await fetch("http://bestcryptotrading.rf.gd/backend/api/check_trades.php", { credentials: "include" });
        const resJson = await response.json();
        if (resJson.status === "success" || resJson.settled > 0) loadData();
      } catch (e) {}
    }, 3000);

    return () => { clearInterval(timer); clearInterval(sync); };
  }, [loadData, activePage]);

  /* ================= KYC LOGIC ================= */
  const handleKycUpload = async () => {
    if (!idFile || !selfieFile) {
      return setKycMsg("Please upload both your ID document and a selfie.");
    }
    
    setIsUploading(true);
    setKycMsg("Uploading documents...");
    
    const formData = new FormData();
    formData.append("id_card", idFile);
    formData.append("selfie", selfieFile);
    
    try {
      const res = await fetch("http://bestcryptotrading.rf.gd/backend/api/submit_kyc.php", { 
        method: "POST", 
        credentials: "include", 
        body: formData 
      });
      const data = await res.json();
      if (data.success) { 
        setKycMsg("Documents submitted successfully!"); 
        setKycStatus("pending"); 
      } else { 
        setKycMsg(data.msg || "Upload failed."); 
      }
    } catch (err) { 
      setKycMsg("Server error during upload."); 
    } finally { 
      setIsUploading(false); 
    }
  };

  /* ================= CONVERT/TRADE/SUPPORT LOGIC ================= */
  const loadSwapHistory = async () => {
    try {
      const res = await fetch("http://bestcryptotrading.rf.gd/backend/api/get_swap_history.php", { credentials: "include" });
      const data = await res.json();
      if (data.success) setSwapHistory(data.history);
    } catch (e) { console.error("Swap history load error", e); }
  };

  const executeConvert = async () => {
    if (!checkAccess("Instant Swap")) return;
    if (!convertAmount || Number(convertAmount) <= 0) return setConvertMsg("Enter amount");
    if (fromCoin === toCoin) return setConvertMsg("Choose different coins");
    
    setIsConverting(true);
    try {
      const res = await fetch("http://bestcryptotrading.rf.gd/backend/api/convert.php", { 
        method: "POST", 
        credentials: "include", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          from_coin: fromCoin, 
          to_coin: toCoin, 
          amount: Number(convertAmount) 
        }) 
      });
      const data = await res.json();
      if (data.success) { 
        setConvertMsg("Successfully converted!"); 
        setConvertAmount(""); 
        loadData(); 
        loadSwapHistory(); 
      } else { 
        setConvertMsg(data.msg || "Conversion failed"); 
      }
    } catch (err) { 
        setConvertMsg("Server error"); 
    } finally { 
        setIsConverting(false); 
    }
  };

  /* ================= UPDATED TRADE LOGIC ================= */
  const executeTrade = async (direction) => {
    if (!checkAccess("Live Trading")) return;
    if (!amount || Number(amount) <= 0) { setMsg("Enter valid amount"); return; }
    
    setLoadingTrade(true);
    try {
      const payload = { 
        coin: selectedCoin.toLowerCase(), 
        direction: direction === "long" ? "up" : "down", 
        amount: Number(amount), 
        duration: timeframeProfitMap[timeframe].seconds, 
        payout: timeframeProfitMap[timeframe].profit / 100 
      };

      const res = await fetch("http://bestcryptotrading.rf.gd/backend/api/trade.php", { 
        method: "POST", 
        credentials: "include", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      
      if (data.status === "success") { 
        setMsg("Order Placed Successfully!"); 
        setAmount(""); 
        loadData(); 

        setTimeout(() => {
          loadData();
          setMsg("Trade Settled - Check History");
        }, (timeframeProfitMap[timeframe].seconds + 2) * 1000);

      } else { 
        setMsg(data.msg || "Trade error"); 
      }
    } catch (err) { 
      setMsg("Server error"); 
    } finally { 
      setLoadingTrade(false); 
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await fetch("http://bestcryptotrading.rf.gd/backend/api/get_support_messages.php", { credentials: "include" });
      const data = await res.json();
      if (data.success) setSupportMessages(data.messages);
    } catch (err) { console.error("Fetch support error"); }
  };

  const sendSupportMessage = async () => {
    if (!checkAccess("Customer Support")) return;
    if (!supportMessage.trim()) return;
    try {
      const res = await fetch("http://bestcryptotrading.rf.gd/backend/api/send_support_message.php", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: supportMessage }), });
      const data = await res.json();
      if (data.success) { setSupportMessage(""); fetchChatHistory(); }
    } catch (err) { console.error("Send message error"); }
  };

  const logout = async () => {
    await fetch("http://bestcryptotrading.rf.gd/backend/api/logout.php", { credentials: "include" });
    onLogout();
  };

  /* ================= UI STYLES ================= */
  const sidebarItem = (page) => ({
    padding: "14px 20px", cursor: "pointer", fontSize: 14,
    background: activePage === page ? "#1e2329" : "transparent",
    color: activePage === page ? "#fcd535" : "#cbd5e1",
    borderLeft: activePage === page ? "4px solid #fcd535" : "4px solid transparent"
  });

  const cardStyle = { background: "#1e2329", padding: 15, borderRadius: 8, marginBottom: 15, border: "1px solid #2b3139" };
  const inputStyle = { width: '100%', padding: 12, background: "#0b0e11", border: "1px solid #474d57", color: "#fff", borderRadius: 4, marginBottom: 15, boxSizing: 'border-box' };

  /* Helper to get status color */
  const getStatusStyle = (status) => {
    const s = status.toLowerCase();
    if (s === "approved" || s === "success") return { color: "#0ecb81", background: "#0ecb8115" };
    if (s === "pending") return { color: "#fcd535", background: "#fcd53515" };
    if (s === "rejected" || s === "failed") return { color: "#f6465d", background: "#f6465d15" };
    return { color: "#848e9c", background: "#ffffff0a" };
  };

  return (
    <div style={{ display: "flex", background: "#0b0e11", color: "#fff", minHeight: "100vh", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: 220, background: "#11151c", paddingTop: 20, borderRight: "1px solid #2b3139" }}>
        <h3 style={{ textAlign: "center", color: "#fcd535", marginBottom: 30 }}>EXCHANGE</h3>
        <div style={sidebarItem("dashboard")} onClick={() => setActivePage("dashboard")}>Dashboard</div>
        <div style={sidebarItem("trade")} onClick={() => checkAccess("Trading") && setActivePage("trade")}>Trade</div>
        <div style={sidebarItem("convert")} onClick={() => checkAccess("Conversion") && setActivePage("convert")}>Convert</div>
        {user?.role !== 'admin' && (
          <div style={sidebarItem("kyc")} onClick={() => setActivePage("kyc")}>
            Verification {kycStatus === 'verified' && <span style={{color: '#0ecb81', fontSize: 10}}>●</span>}
          </div>
        )}
        <div style={sidebarItem("support")} onClick={() => checkAccess("Support") && setActivePage("support")}>Support</div>
        <div style={{ ...sidebarItem("deposit"), color: "#848e9c" }} onClick={() => checkAccess("Deposits") && setShowDeposit(true)}>Deposit</div>
        <div style={{ ...sidebarItem("withdraw"), color: "#848e9c" }} onClick={() => checkAccess("Withdrawals") && setShowWithdraw(true)}>Withdraw</div>
        <div style={{ ...sidebarItem("logout"), color: "#f6465d", marginTop: 20 }} onClick={logout}>Logout</div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: 30 }}>
        
        {activePage === "dashboard" && (
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <h2>Account Overview</h2>
               {kycStatus === 'verified' && <span style={{background: '#0ecb8122', color: '#0ecb81', padding: '5px 12px', borderRadius: 20, fontSize: 12, border: '1px solid #0ecb81'}}>Verified User</span>}
            </div>
            <div style={cardStyle}>
              <p style={{ color: "#848e9c", margin: "0 0 10px 0" }}>Total Estimated Portfolio Balance</p>
              <h1 style={{ color: "#fcd535", margin: 0 }}>${totalUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
              {/* ASSETS TABLE */}
              <div style={cardStyle}>
                <h3 style={{ borderBottom: "1px solid #2b3139", paddingBottom: 10 }}>My Assets</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "#848e9c", textAlign: "left", fontSize: "12px" }}>
                      <th style={{ paddingBottom: 10 }}>Coin</th>
                      <th style={{ paddingBottom: 10 }}>Balance</th>
                      <th style={{ paddingBottom: 10, textAlign: "right" }}>Value (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((wallet) => {
                      const symbol = wallet.coin.toUpperCase();
                      const livePrice = symbol === "USDT" ? 1 : (allPrices[coinIdMap[symbol]]?.usd || 0);
                      return (
                        <tr key={wallet.id} style={{ borderBottom: "1px solid #2b3139" }}>
                          <td style={{ padding: "12px 0", fontWeight: "bold" }}>{symbol}</td> 
                          <td>{Number(wallet.balance).toFixed(4)}</td>
                          <td style={{ textAlign: "right", fontWeight: "bold", color: "#fcd535" }}>${(wallet.balance * livePrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* WITHDRAWAL HISTORY SECTION */}
              <div style={cardStyle}>
                <h3 style={{ borderBottom: "1px solid #2b3139", paddingBottom: 10 }}>Withdrawal History</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {withdrawals.length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ color: "#848e9c", textAlign: "left", fontSize: "11px" }}>
                          <th style={{ paddingBottom: 10 }}>Amount</th>
                          <th style={{ paddingBottom: 10 }}>Status</th>
                          <th style={{ paddingBottom: 10, textAlign: "right" }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map((w) => {
                          const statusStyle = getStatusStyle(w.status);
                          return (
                            <tr key={w.id} style={{ borderBottom: "1px solid #2b3139", fontSize: '13px' }}>
                              <td style={{ padding: "12px 0" }}>{w.amount} {w.coin?.toUpperCase() || 'USDT'}</td>
                              <td>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  textTransform: 'uppercase',
                                  ...statusStyle
                                }}>
                                  {w.status}
                                </span>
                              </td>
                              <td style={{ textAlign: "right", color: '#848e9c', fontSize: '11px' }}>
                                {new Date(w.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#474d57', fontSize: '13px' }}>No recent withdrawals</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* UPDATED RECENT TRADE HISTORY WITH STYLISH CARDS */}
            <div style={{ ...cardStyle, background: 'transparent', border: 'none', padding: 0, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ margin: 0 }}>Recent Trade History</h3>
                <button 
                  onClick={() => setShowRecentHistory(!showRecentHistory)}
                  style={{ background: '#1e2329', border: '1px solid #474d57', color: '#fcd535', padding: '6px 15px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                >
                  {showRecentHistory ? "Hide Cards" : "Show Cards"}
                </button>
              </div>

              {showRecentHistory && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {trades
                    .filter(t => t.status !== 'open')
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((t) => {
                      const isWin = Number(t.profit) > 0;
                      const entry = Number(t.entry_price);
                      let closePrice = Number(t.closing_price);
                      
                      if (!closePrice || closePrice === entry) {
                        const movement = entry * 0.0025;
                        if (t.direction === 'up') {
                          closePrice = isWin ? entry + movement : entry - movement;
                        } else {
                          closePrice = isWin ? entry - movement : entry + movement;
                        }
                      }

                      return (
                        <div key={t.id} style={{
                          background: isWin 
                            ? "linear-gradient(135deg, #1e2329 0%, #0ecb8115 100%)" 
                            : "linear-gradient(135deg, #1e2329 0%, #f6465d15 100%)",
                          padding: '18px',
                          borderRadius: '12px',
                          border: `1px solid ${isWin ? '#0ecb8144' : '#f6465d44'}`,
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}>
                          {/* Result Badge */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            background: isWin ? '#0ecb81' : '#f6465d',
                            color: '#fff',
                            padding: '4px 12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            borderBottomLeftRadius: '12px'
                          }}>
                            {isWin ? 'PROFIT' : 'LOSS'}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{t.coin.toUpperCase()}</span>
                              <span style={{ fontSize: '12px', color: '#848e9c', marginLeft: '8px' }}>{t.duration}s</span>
                            </div>
                            <div style={{ color: t.direction === 'up' ? '#0ecb81' : '#f6465d', fontWeight: 'bold' }}>
                              {t.direction === 'up' ? '▲ CALL' : '▼ PUT'}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                            <div>
                              <div style={{ fontSize: '10px', color: '#848e9c', textTransform: 'uppercase' }}>Entry Price</div>
                              <div style={{ fontSize: '14px', fontWeight: '500' }}>${entry.toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: '#848e9c', textTransform: 'uppercase' }}>Close Price</div>
                              <div style={{ fontSize: '14px', fontWeight: '500' }}>${closePrice.toLocaleString()}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #ffffff10' }}>
                            <div>
                              <div style={{ fontSize: '10px', color: '#848e9c' }}>Investment</div>
                              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>${t.amount}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '10px', color: '#848e9c' }}>Result</div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: isWin ? '#0ecb81' : '#f6465d' }}>
                                {isWin ? '+' : ''}${Math.abs(Number(t.profit)).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {trades.filter(t => t.status !== 'open').length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: '#1e2329', borderRadius: '8px', color: '#474d57' }}>
                      No trade history available
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ marginTop: 30, ...cardStyle }}>
                <h3 style={{ marginBottom: 20 }}>Profit Analytics</h3>
                <ProfitChart trades={trades.filter(t => t.status !== 'open')} />
              </div>
            </div>
          </>
        )}

        {/* KYC VIEW */}
        {activePage === "kyc" && (
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <h2>Identity Verification</h2>
              <div style={cardStyle}>
                {kycStatus === "verified" ? (
                  <div style={{textAlign: 'center', padding: '40px 0'}}>
                     <div style={{fontSize: 50, color: '#0ecb81'}}>✓</div>
                     <h3>Account Verified</h3>
                     <p style={{color: '#848e9c'}}>All features are now unlocked.</p>
                  </div>
                ) : (
                  <>
                    {kycMsg && <div style={{background: 'rgba(246, 70, 93, 0.1)', color: '#f6465d', padding: 15, borderRadius: 4, marginBottom: 20, textAlign: 'center', fontSize: 14}}>{kycMsg}</div>}
                    <p style={{color: '#cbd5e1', marginBottom: 20}}>Please upload your ID and a selfie to unlock all features.</p>
                    
                    <div style={{marginBottom: 20}}>
                       <label style={{display: 'block', marginBottom: 10, fontSize: 14, color: '#848e9c'}}>1. ID Document (Passport or Driver's License)</label>
                       <div style={{border: '2px dashed #474d57', padding: 20, textAlign: 'center', borderRadius: 8}}>
                          <input type="file" accept="image/*" onChange={(e) => setIdFile(e.target.files[0])} />
                       </div>
                    </div>

                    <div style={{marginBottom: 25}}>
                       <label style={{display: 'block', marginBottom: 10, fontSize: 14, color: '#848e9c'}}>2. Selfie holding ID</label>
                       <div style={{border: '2px dashed #474d57', padding: 20, textAlign: 'center', borderRadius: 8}}>
                          <input type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files[0])} />
                       </div>
                    </div>

                    <button disabled={isUploading || kycStatus === 'pending'} onClick={handleKycUpload} style={{ width: "100%", background: "#fcd535", color: "#000", fontWeight: "bold", padding: 15, border: "none", borderRadius: 4, cursor: "pointer" }}>
                      {kycStatus === 'pending' ? "Under Review" : isUploading ? "Uploading..." : "Submit for Verification"}
                    </button>
                  </>
                )}
              </div>
            </div>
        )}

        {/* TRADE VIEW */}
        {activePage === "trade" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                <h2>Smart Contract Trading</h2>
                <select 
                  value={selectedCoin} 
                  onChange={(e) => setSelectedCoin(e.target.value)}
                  style={{...inputStyle, marginBottom: 0, width: 'auto', padding: '8px 15px', background: '#1e2329'}}
                >
                  {Object.entries(coinIdMap).map(([symbol, id]) => (
                    <option key={id} value={id}>{symbol} / USDT</option>
                  ))}
                </select>
              </div>
              
              <div style={{display: 'flex', gap: '10px'}}>
                  {Object.keys(timeframeProfitMap).map(tf => (
                    <button 
                        key={tf} 
                        onClick={() => setTimeframe(tf)}
                        style={{
                            padding: '8px 12px', 
                            background: timeframe === tf ? '#fcd535' : '#1e2329',
                            color: timeframe === tf ? '#000' : '#848e9c',
                            border: '1px solid #474d57',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    >
                        {tf} ({timeframeProfitMap[tf].profit}%)
                    </button>
                  ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "30px" }}>
              <div>
                <div style={cardStyle}><LiveChart coin={selectedCoin} /></div>
                
                <div style={cardStyle}>
                   <h3 style={{fontSize: 14, color: '#848e9c'}}>Active Positions</h3>
                   <div style={{overflowX: 'auto'}}>
                     <table style={{width: '100%', fontSize: 12, borderCollapse: 'collapse'}}>
                        <thead>
                           <tr style={{color: '#848e9c', textAlign: 'left', borderBottom: '1px solid #2b3139'}}>
                              <th style={{padding: '10px 0'}}>Asset</th>
                              <th>Entry Price</th>
                              <th>Live Price</th>
                              <th>Amount</th>
                              <th>Remaining</th>
                              <th>Status</th>
                           </tr>
                        </thead>
                        <tbody>
                           {trades.filter(t => t.status === 'open').map((t) => {
                             const expiry = new Date(t.created_at).getTime() + (t.duration * 1000);
                             const now = Date.now();
                             const timeLeft = Math.max(0, Math.floor((expiry - now) / 1000));
                             
                             const displayPrice = t.direction === 'up' 
                               ? (Number(t.entry_price) * 1.001).toFixed(2) 
                               : (Number(t.entry_price) * 0.999).toFixed(2);

                             return (
                               <tr key={t.id} style={{borderBottom: '1px solid #2b3139'}}>
                                  <td style={{padding: '12px 0'}}>{t.coin.toUpperCase()} <span style={{color: t.direction === 'up' ? '#0ecb81' : '#f6465d'}}>{t.direction.toUpperCase()}</span></td>
                                  <td>${Number(t.entry_price).toLocaleString()}</td>
                                  <td style={{color: '#0ecb81'}}>${displayPrice}</td>
                                  <td>${t.amount}</td>
                                  <td style={{color: '#fcd535', fontWeight: 'bold'}}>{timeLeft}s</td>
                                  <td style={{color: '#0ecb81', fontWeight: 'bold'}}>WINNING</td>
                               </tr>
                             );
                           })}
                           {trades.filter(t => t.status === 'open').length === 0 && (
                             <tr><td colSpan="6" style={{textAlign: 'center', padding: 20, color: '#474d57'}}>No active trades</td></tr>
                           )}
                        </tbody>
                     </table>
                   </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Place Order</h3>
                <label style={{fontSize: 12, color: '#848e9c'}}>Amount (USDT)</label>
                <input type="number" style={inputStyle} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                
                <div style={{background: '#0b0e11', padding: '15px', borderRadius: '4px', marginBottom: '20px', border: '1px solid #474d57'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                      <span style={{fontSize: 12, color: '#848e9c'}}>Payout</span>
                      <span style={{fontSize: 12, color: '#0ecb81', fontWeight: 'bold'}}>{timeframeProfitMap[timeframe].profit}%</span>
                   </div>
                   <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{fontSize: 12, color: '#848e9c'}}>Potential Profit</span>
                      <span style={{fontSize: 12, color: '#fcd535', fontWeight: 'bold'}}>${(Number(amount) * (timeframeProfitMap[timeframe].profit/100)).toFixed(2)}</span>
                   </div>
                </div>

                <button 
                    disabled={loadingTrade}
                    onClick={() => executeTrade("long")} 
                    style={{ width: "100%", background: "#0ecb81", color: "#fff", border: "none", padding: 15, fontWeight: "bold", borderRadius: 4, cursor: "pointer", display: 'flex', justifyContent: 'space-between' }}
                >
                    <span>BUY / UP</span>
                    <span>↑</span>
                </button>
                <button 
                    disabled={loadingTrade}
                    onClick={() => executeTrade("short")} 
                    style={{ width: "100%", background: "#f6465d", color: "#fff", border: "none", padding: 15, marginTop: 10, fontWeight: "bold", borderRadius: 4, cursor: "pointer", display: 'flex', justifyContent: 'space-between' }}
                >
                    <span>SELL / DOWN</span>
                    <span>↓</span>
                </button>
                {msg && <div style={{ textAlign: "center", color: "#fcd535", marginTop: 15, fontSize: 13 }}>{msg}</div>}
              </div>
            </div>
          </>
        )}

        {/* CONVERT VIEW */}
        {activePage === "convert" && (
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Instant Swap</h2>
                <button 
                  onClick={() => setShowConvertHistory(!showConvertHistory)} 
                  style={{ background: 'transparent', border: '1px solid #474d57', color: '#848e9c', padding: '8px 15px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                >
                  {showConvertHistory ? "Hide History" : "Show History"}
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: showConvertHistory ? '1fr 1fr' : '1fr', gap: '20px', transition: 'all 0.3s' }}>
                <div style={cardStyle}>
                    <label style={{color: '#848e9c', fontSize: 12}}>From</label>
                    <select value={fromCoin} onChange={(e) => setFromCoin(e.target.value)} style={inputStyle}>
                      {Object.keys(coinIdMap).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    
                    <label style={{color: '#848e9c', fontSize: 12}}>Amount</label>
                    <input type="number" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} style={inputStyle} placeholder="0.00" />
                    
                    <div style={{textAlign: 'center', margin: '10px 0', color: '#848e9c'}}>↓</div>
                    
                    <label style={{color: '#848e9c', fontSize: 12}}>To</label>
                    <select value={toCoin} onChange={(e) => setToCoin(e.target.value)} style={inputStyle}>
                      {Object.keys(coinIdMap).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <button disabled={isConverting} onClick={executeConvert} style={{width: '100%', background: '#fcd535', color: '#000', padding: 15, border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer'}}>
                      {isConverting ? "Converting..." : "Convert Assets"}
                    </button>
                    {convertMsg && <p style={{textAlign: 'center', color: '#fcd535', fontSize: 13}}>{convertMsg}</p>}
                </div>
                
                {showConvertHistory && (
                  <div style={cardStyle}>
                    <h3 style={{fontSize: 14, marginBottom: 15}}>Conversion History</h3>
                    <div style={{maxHeight: 400, overflowY: 'auto'}}>
                      {swapHistory.map((h, i) => (
                        <div key={i} style={{padding: '10px 0', borderBottom: '1px solid #2b3139', fontSize: 12}}>
                          <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span>{h.from_amount} {h.from_coin} → {h.to_amount} {h.to_coin}</span>
                            <span style={{color: '#848e9c'}}>{new Date(h.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
        )}

        {/* SUPPORT VIEW */}
        {activePage === "support" && (
           <div style={{ maxWidth: "800px", margin: "0 auto", height: '80vh', display: 'flex', flexDirection: 'column' }}>
              <h2>Support Center</h2>
              <div style={{...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                 <div style={{flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 10}}>
                    {supportMessages.map((m, i) => (
                      <div key={i} style={{
                        alignSelf: m.sender_id == user.id ? 'flex-end' : 'flex-start',
                        background: m.sender_id == user.id ? '#fcd535' : '#2b3139',
                        color: m.sender_id == user.id ? '#000' : '#fff',
                        padding: '10px 15px',
                        borderRadius: 10,
                        maxWidth: '70%',
                        fontSize: 14
                      }}>
                        {m.message}
                        <div style={{fontSize: 9, opacity: 0.7, marginTop: 5, textAlign: 'right'}}>{new Date(m.created_at).toLocaleTimeString()}</div>
                      </div>
                    ))}
                 </div>
                 <div style={{display: 'flex', gap: 10, padding: 10, borderTop: '1px solid #2b3139'}}>
                    <input 
                      style={{...inputStyle, marginBottom: 0}} 
                      placeholder="Type your message..." 
                      value={supportMessage} 
                      onChange={(e) => setSupportMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendSupportMessage()}
                    />
                    <button onClick={sendSupportMessage} style={{background: '#fcd535', color: '#000', border: 'none', padding: '0 20px', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer'}}>Send</button>
                 </div>
              </div>
           </div>
        )}

      </div>

      {/* MODALS */}
      {showDeposit && <Deposit onClose={() => { setShowDeposit(false); loadData(); }} />}
      {showWithdraw && <Withdraw wallets={wallets} onClose={() => { setShowWithdraw(false); loadData(); }} />}
    </div>
  );
}
