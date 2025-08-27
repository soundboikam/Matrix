"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type StreamData = {
  date: string;
  streams: number;
};

export default function ArtistChart({ data }: { data: StreamData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#aaa" />
        <YAxis stroke="#aaa" />
        <Tooltip
          contentStyle={{ backgroundColor: "#111", border: "1px solid #333" }}
          labelStyle={{ color: "#fff" }}
        />
        <Line
          type="monotone"
          dataKey="streams"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}