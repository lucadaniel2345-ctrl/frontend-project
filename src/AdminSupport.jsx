import { useState, useEffect } from "react";

export default function AdminSupport() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://bestcryptotrading.rf.gd/backend/api/adminUsers.php")
      .then(r => r.json())
      .then(setUsers);
  }, []);

  return (
    <div>
      <h2>Support Chats</h2>

      {users.map(u => (
        <div key={u.user_id}>
          User #{u.user_id}
        </div>
      ))}
    </div>
  );
}
