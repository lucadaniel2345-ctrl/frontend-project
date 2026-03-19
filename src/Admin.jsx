import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://bestcryptotrading.rf.gd/backend/api/";

export default function AdminPanel({ user, onLogout }) {
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") navigate("/dashboard");
  }, [user, navigate]);

  // All States
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editedWallets, setEditedWallets] = useState({});
  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [trades, setTrades] = useState([]);
  
  // Support States
  const [supportChats, setSupportChats] = useState([]); 
  const [replyMessage, setReplyMessage] = useState({});
  const [openChats, setOpenChats] = useState({}); 
  
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, msg: "", type: "" });

  /* ================= HELPERS ================= */
  const showStatus = (msg, type = "success") => {
    setNotification({ show: true, msg, type });
    setTimeout(() => setNotification({ show: false, msg: "", type: "" }), 3000);
  };

  const safeFetch = async (endpoint, options = {}) => {
    try {
      const res = await fetch(API + endpoint, {
        credentials: "include",
        ...options,
      });
      return await res.json();
    } catch (err) {
      console.error("Fetch error:", err);
      return { success: false };
    }
  };

  /* ================= LOAD ALL DATA ================= */
  const loadData = async () => {
    setLoading(true);

    const u = await safeFetch("admin_get_users.php");
    if (u.success) setUsers(u.users);

    const w = await safeFetch("admin_get_withdrawals.php");
    if (w.success) setWithdrawals(w.withdrawals);

    const d = await safeFetch("admin_get_deposits.php");
    if (d.success) setDeposits(d.deposits);

    const t = await safeFetch("admin_get_trades.php");
    if (t.success) setTrades(t.trades);

    const s = await safeFetch("admin_get_tickets.php"); 
    if (s.success && s.tickets) {
      const grouped = s.tickets.reduce((acc, curr) => {
        if (!acc[curr.user_id]) {
          acc[curr.user_id] = { 
            user_id: curr.user_id, 
            email: curr.email, 
            messages: [] 
          };
        }
        acc[curr.user_id].messages.push(curr);
        return acc;
      }, {});
      setSupportChats(Object.values(grouped));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === "admin") loadData();
  }, [user]);

  /* ================= KYC ACTIONS ================= */
  const processKyc = async (userId, action) => {
    const res = await safeFetch("admin_process_kyc.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action: action }),
    });

    if (res.success) {
      showStatus(`KYC ${action.toUpperCase()} Successful`);
      loadData(); // Refresh user list to reflect changes
    } else {
      alert(res.msg || "KYC action failed");
    }
  };

  /* ================= USER & WALLET ACTIONS ================= */
  const toggleTrading = async (userId, currentStatus) => {
    const newStatus = parseInt(currentStatus) === 1 ? 0 : 1;
    const res = await safeFetch("toggle_trade.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, status: newStatus }),
    });

    if (res.success) {
      showStatus(newStatus === 1 ? "Trade Enabled" : "Trade Disabled");
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, trading_enabled: newStatus } : u)
      );
    }
  };

  const loadUserWallets = async (userId) => {
    setSelectedUser(userId);
    const data = await safeFetch(`admin_get_user_wallets.php?user_id=${userId}`);
    if (data.success) {
        const mainCoins = ['BTC', 'ETH', 'SOL', 'LTC', 'DOGE', 'BNB', 'XRP', 'ADA', 'TRX', 'USDT'];
        const normalizedWallets = mainCoins.map(coin => {
            const existing = data.wallets.find(w => w.coin.toUpperCase() === coin);
            return existing || { id: `new_${coin}`, coin: coin, balance: "0.000000" };
        });
        setWallets(normalizedWallets);
    } else {
        alert("Failed to load wallets");
    }
  };

  const updateWallet = async (walletId, coinSymbol) => {
    const balance = editedWallets[walletId];
    if (balance === undefined) return alert("Enter new balance first");

    const payload = walletId.toString().startsWith('new_') 
        ? { user_id: selectedUser, coin: coinSymbol, balance: parseFloat(balance) }
        : { wallet_id: walletId, balance: parseFloat(balance) };

    const res = await safeFetch("admin_update_wallet.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if(res.success) { 
        showStatus("Wallet Updated"); 
        loadUserWallets(selectedUser);
    } else {
        alert(res.message || "Update failed");
    }
  };

  /* ================= TRANSACTION ACTIONS ================= */
  const processWithdraw = async (id, action) => {
    const endpoint = action === 'approve' ? "admin_approve_withdrawal.php" : "admin_reject_withdrawal.php";
    const res = await safeFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id }), 
    });

    if(res.success) { 
        showStatus(`Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'}`); 
        loadData(); 
    } else {
        alert(res.message || "Withdrawal action failed");
    }
  };

  const processDeposit = async (id, action) => {
    const res = await safeFetch("admin_process_deposit.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deposit_id: id, action }),
    });
    if(res.success) { showStatus(`Deposit ${action}ed`); loadData(); }
  };

  /* ================= SUPPORT ACTIONS ================= */
  const replyToChat = async (userId) => {
    const msgContent = replyMessage[userId];
    if (!msgContent || msgContent.trim() === "") return;

    const res = await safeFetch("admin_reply_ticket.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, message: msgContent }),
    });

    if (res.success) {
      setReplyMessage(prev => ({ ...prev, [userId]: "" }));
      loadData(); 
    }
  };

  const deleteChat = async (e, userId) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure? This will delete the chat for both you and the user.")) return;

    const res = await safeFetch("admin_delete_chat.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });

    if (res.success) {
      showStatus("Chat Deleted");
      loadData();
    }
  };

  const toggleChat = (userId) => {
    setOpenChats(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleLogout = async () => {
    await safeFetch("logout.php");
    onLogout();
    navigate("/login");
  };

  /* ================= STYLES ================= */
  const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 15 };
  const thStyle = { background: "#1e2329", padding: 12, textAlign: "left", color: "#fcd535" };
  const tdStyle = { padding: 10, borderBottom: "1px solid #2b3139" };
  const card = { background: "#14181d", padding: 20, borderRadius: 10, marginBottom: 30 };

  if (!user) return null;
  if (loading) return <div style={{ background: "#0b0e11", color: "#fff", minHeight: "100vh", padding: 40 }}>Loading Admin Panel...</div>;

  return (
    <div style={{ background: "#0b0e11", color: "#fff", minHeight: "100vh", padding: 30 }}>
      {notification.show && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "15px 25px", borderRadius: "5px", backgroundColor: notification.type === "success" ? "#0ecb81" : "#f6465d", color: "#fff" }}>
          {notification.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ color: "#fcd535", margin: 0 }}>Admin Control Center</h1>
        <button onClick={handleLogout} style={{ background: "#f6465d", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Logout</button>
      </div>

      {/* KYC VERIFICATION QUEUE */}
      <div style={card}>
        <h2 style={{ color: "#fcd535" }}>Pending KYC Verifications</h2>
        {users.filter(u => u.kyc_status === 'pending').length === 0 ? <p style={{color: '#848e9c'}}>No pending verifications.</p> : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>User</th>
                <th style={thStyle}>ID Card</th>
                <th style={thStyle}>Selfie</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.kyc_status === 'pending').map(u => (
                <tr key={u.id}>
                  <td style={tdStyle}>{u.email}<br/><small>ID: {u.id}</small></td>
                  <td style={tdStyle}>
                    <a href={`http://localhost/backend/uploads/kyc/${u.kyc_id_path}`} target="_blank" rel="noreferrer">
                      <img src={`http://localhost/backend/uploads/kyc/${u.kyc_id_path}`} alt="ID" style={{width: 60, height: 40, borderRadius: 4, objectFit: 'cover'}} />
                    </a>
                  </td>
                  <td style={tdStyle}>
                    <a href={`http://localhost/backend/uploads/kyc/${u.kyc_selfie_path}`} target="_blank" rel="noreferrer">
                      <img src={`http://localhost/backend/uploads/kyc/${u.kyc_selfie_path}`} alt="Selfie" style={{width: 60, height: 40, borderRadius: 4, objectFit: 'cover'}} />
                    </a>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => processKyc(u.id, 'approve')} style={{ background: "#0ecb81", color: "white", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", marginRight: 8 }}>Approve</button>
                    <button onClick={() => processKyc(u.id, 'reject')} style={{ background: "#f6465d", color: "white", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* USER MANAGEMENT */}
      <div style={card}>
        <h2>User Management</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>User</th>
              <th style={thStyle}>KYC Status</th>
              <th style={thStyle}>Trading</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={tdStyle}>{u.id}</td>
                <td style={tdStyle}>{u.username || u.email}</td>
                <td style={tdStyle}>
                    <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px',
                        background: u.kyc_status === 'verified' ? '#0ecb8122' : '#2b3139',
                        color: u.kyc_status === 'verified' ? '#0ecb81' : '#848e9c',
                        border: u.kyc_status === 'verified' ? '1px solid #0ecb81' : '1px solid transparent'
                    }}>
                        {u.kyc_status.toUpperCase()}
                    </span>
                </td>
                <td style={tdStyle}><span style={{ color: parseInt(u.trading_enabled) === 1 ? "#0ecb81" : "#f6465d" }}>{parseInt(u.trading_enabled) === 1 ? "ACTIVE" : "BLOCKED"}</span></td>
                <td style={tdStyle}>
                  <button onClick={() => toggleTrading(u.id, u.trading_enabled)} style={{ background: parseInt(u.trading_enabled) === 1 ? "#f6465d" : "#0ecb81", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer", marginRight: 5 }}>{parseInt(u.trading_enabled) === 1 ? "Block" : "Allow"}</button>
                  <button onClick={() => loadUserWallets(u.id)} style={{ background: "#2b3139", color: "#fff", border: "1px solid #474d57", padding: "8px 15px", borderRadius: "4px", cursor: "pointer", marginRight: 5 }}>Wallets</button>
                  {/* FIX BUTTON: If user is verified but stuck, click Reset to let them re-verify */}
                  <button onClick={() => { if(window.confirm("Reset KYC? This will let the user upload documents again.")) processKyc(u.id, 'reset')}} style={{ background: "transparent", color: "#fcd535", border: "1px solid #fcd535", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}>Reset KYC</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* WALLET EDITOR SECTION */}
        {selectedUser && (
          <div style={{ marginTop: 20, padding: 15, background: "#0b0e11", borderRadius: 8, border: "1px solid #fcd535" }}>
            <h3 style={{ color: "#fcd535", marginTop: 0 }}>
                Editing Crypto Wallets: User #{selectedUser} 
                <button onClick={() => setSelectedUser(null)} style={{ float: "right", color: "#f6465d", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>Close ✖</button>
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 15 }}>
                {wallets.map(w => (
                <div key={w.id} style={{ background: "#1e2329", padding: 10, borderRadius: 5, border: "1px solid #2b3139" }}>
                    <div style={{ marginBottom: 5, fontWeight: "bold", color: "#fcd535" }}>{w.coin.toUpperCase()}</div>
                    <input 
                        type="number" 
                        step="0.000001"
                        placeholder="0.00"
                        defaultValue={w.balance} 
                        onChange={(e) => setEditedWallets({...editedWallets, [w.id]: e.target.value})} 
                        style={{ width: "90%", background: "#0b0e11", color: "#fff", border: "1px solid #474d57", padding: "8px", borderRadius: "4px" }} 
                    />
                    <button onClick={() => updateWallet(w.id, w.coin)} style={{ marginTop: 8, width: "100%", background: "#fcd535", border: "none", padding: 8, borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>Save Balance</button>
                </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* TRANSACTION QUEUE */}
      <div style={card}>
        <h2>Pending Transactions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <h4 style={{ color: "#0ecb81" }}>Deposits</h4>
            {deposits.filter(d => d.status === 'pending').map(d => (
                <div key={d.id} style={{ background: "#1e2329", padding: 10, marginBottom: 5, borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{d.amount} {d.coin}</span>
                    <button style={{background: "#0ecb81", border: "none", color: "white", padding: "5px 10px", borderRadius: 4, cursor: "pointer"}} onClick={() => processDeposit(d.id, 'approve')}>Approve</button>
                </div>
            ))}
          </div>
          <div>
            <h4 style={{ color: "#f6465d" }}>Withdrawals</h4>
            {withdrawals.filter(w => w.status === 'pending').map(w => (
                <div key={w.id} style={{ background: "#1e2329", padding: 10, marginBottom: 5, borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{w.amount} {w.coin || w.currency}</span>
                        <small style={{ fontSize: "10px", color: "#848e9c" }}>To: {w.address}</small>
                    </div>
                    <div style={{ display: "flex", gap: "5px" }}>
                        <button style={{background: "#0ecb81", border: "none", color: "white", padding: "5px 10px", borderRadius: 4, cursor: "pointer"}} onClick={() => processWithdraw(w.id, 'approve')}>Approve</button>
                        <button style={{background: "#f6465d", border: "none", color: "white", padding: "5px 10px", borderRadius: 4, cursor: "pointer"}} onClick={() => processWithdraw(w.id, 'reject')}>Reject</button>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUPPORT CHATS */}
      <div style={card}>
        <h2>Live Support Chats</h2>
        {supportChats.length === 0 ? <p>No messages yet.</p> : supportChats.map((chat) => (
          <div key={chat.user_id} style={{ background: "#0b0e11", borderRadius: 8, marginBottom: 15, border: "1px solid #2b3139", overflow: "hidden" }}>
            <div 
              onClick={() => toggleChat(chat.user_id)}
              style={{ padding: "15px", background: "#1e2329", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <strong style={{ color: "#fcd535" }}>{chat.email} (ID: {chat.user_id})</strong>
                <span style={{ marginLeft: 15, fontSize: "12px", color: "#848e9c" }}>
                    Last: {chat.messages[chat.messages.length - 1].message.substring(0, 30)}...
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <button onClick={(e) => deleteChat(e, chat.user_id)} style={{ background: "#f6465d", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}>Delete Chat</button>
                <span style={{ color: "#fcd535" }}>{openChats[chat.user_id] ? "▲" : "▼"}</span>
              </div>
            </div>

            {openChats[chat.user_id] && (
              <div style={{ padding: 15 }}>
                <div style={{ maxHeight: "250px", overflowY: "auto", background: "#1e2329", padding: 10, borderRadius: 5, marginBottom: 10 }}>
                  {chat.messages.map((m, idx) => (
                    <div key={idx} style={{ marginBottom: 12, textAlign: m.sender === 'admin' ? 'right' : 'left' }}>
                      <div style={{ display: "inline-block", padding: "8px 14px", borderRadius: "12px", fontSize: "13px", maxWidth: "80%", background: m.sender === 'admin' ? "#fcd535" : "#2b3139", color: m.sender === 'admin' ? "#000" : "#fff" }}>
                        {m.message}
                      </div>
                      <div style={{ fontSize: "10px", color: "#848e9c", marginTop: 2 }}>{m.sender.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    placeholder="Type reply and press Enter..."
                    value={replyMessage[chat.user_id] || ""}
                    onChange={(e) => setReplyMessage({ ...replyMessage, [chat.user_id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && replyToChat(chat.user_id)}
                    style={{ flex: 1, background: "#1e2329", color: "#fff", border: "1px solid #474d57", padding: 12, borderRadius: 4 }}
                  />
                  <button onClick={() => replyToChat(chat.user_id)} style={{ background: "#fcd535", color: "#000", border: "none", padding: "0 25px", borderRadius: 4, fontWeight: "bold", cursor: "pointer" }}>Send</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
