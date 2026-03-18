import { useState, useEffect } from "react";

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const loadMessages = async () => {
    const res = await fetch(
      "http://localhost/backend/api/getMessages.php",
      { credentials: "include" }
    );
    const data = await res.json();
    setMessages(data);
  };

  useEffect(() => {
    if (open) {
      loadMessages();
      const timer = setInterval(loadMessages, 2000);
      return () => clearInterval(timer);
    }
  }, [open]);

  const send = async () => {
    if (!text) return;

    await fetch(
      "http://localhost/backend/api/sendMessage.php",
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      }
    );

    setText("");
    loadMessages();
  };

  return (
    <>
      {!open && (
        <button style={btn} onClick={() => setOpen(true)}>
          💬 Support
        </button>
      )}

      {open && (
        <div style={box}>
          <div style={header}>
            Support
            <button onClick={() => setOpen(false)}>X</button>
          </div>

          <div style={msgs}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={
                  m.sender === "user" ? userMsg : adminMsg
                }
              >
                {m.message}
              </div>
            ))}
          </div>

          <div style={inputRow}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={send}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}

const btn = { position:"fixed", bottom:20, right:20 };
const box = {
  position:"fixed", bottom:20, right:20,
  width:300, height:400, background:"#fff",
  display:"flex", flexDirection:"column"
};
const header = { background:"#2563eb", color:"#fff", padding:8 };
const msgs = { flex:1, overflowY:"auto", padding:8 };
const userMsg = { background:"#2563eb", color:"#fff", padding:6, margin:4 };
const adminMsg = { background:"#eee", padding:6, margin:4 };
const inputRow = { display:"flex" };