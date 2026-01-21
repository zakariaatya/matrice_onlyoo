import React, { useEffect, useState } from "react";
import api from "./api";

export default function NotificationsBar() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/notifications")
      .then(({ data }) => setItems(data.notifications || []))
      .catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
      <div className="font-bold text-yellow-800 mb-2">📌 Notification Manager</div>
      <div className="space-y-2">
        {items.slice(0, 3).map(n => (
          <div key={n.id} className="text-sm">
            <div className="font-semibold text-yellow-900">{n.title}</div>
            <div className="text-yellow-900/80">{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

