import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ProfitChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfit = async () => {
    try {
      const res = await fetch(
        "http://localhost/backend/api/get_user_trades.php",
        { credentials: "include" }
      );

      const json = await res.json();
      if (!json.success) return;

      let total = 0;

      const formatted = json.trades
        .filter((t) => t.status === "closed")
        .sort((a, b) => new Date(a.closed_at) - new Date(b.closed_at))
        .map((t) => {
          total += Number(t.profit || 0);

          return {
            time: new Date(t.closed_at).toLocaleTimeString(),
            profit: Number(total.toFixed(2)),
          };
        });

      setData(formatted);
      setLoading(false);
    } catch (err) {
      console.error("Profit chart error:", err);
    }
  };

  useEffect(() => {
    loadProfit();

    // refresh every 5 seconds
    const interval = setInterval(loadProfit, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading profit chart...</div>;

  if (data.length === 0)
    return <div>No completed trades yet.</div>;

  return (
    <div style={{ width: "100%", height: 250 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="time" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="profit"
            stroke="#00ff88"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}