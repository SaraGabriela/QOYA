
"use client";
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface PurchasesChartProps {
  data: Array<{ date: string; amount: number }>;
  filter: "month" | "week" | "custom";
}

export const PurchasesChart: React.FC<PurchasesChartProps> = ({ data, filter }) => {
  // Agrupar por día según filtro
  let grouped: { day: number; amount: number }[] = [];
  if (filter === "week") {
    grouped = data.map((d, i) => ({ day: i + 1, amount: d.amount }));
  } else if (filter === "month") {
    grouped = data.map((d, i) => ({ day: i + 1, amount: d.amount }));
  } else {
    // custom: mostrar por día real
    grouped = data.map(d => ({ day: new Date(d.date).getDate(), amount: d.amount }));
  }

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[400px] flex flex-col justify-center items-center">
      <span className="text-pastel-blue text-2xl font-bold mb-6">Purchases Overview</span>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={grouped} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#A7C7E7" />
          <XAxis dataKey="day" tick={{ fill: "#A7C7E7", fontWeight: 600, fontSize: 16 }} label={{ value: "Day", position: "insideBottom", offset: -5 }} />
          <YAxis tick={{ fill: "#A7C7E7", fontWeight: 600, fontSize: 16 }} />
          <Tooltip contentStyle={{ background: "#F7FAFC", border: "1px solid #A7C7E7", color: "#22223B", fontSize: 16 }} />
          <Line type="monotone" dataKey="amount" stroke="#A7C7E7" strokeWidth={4} dot={{ r: 8, fill: "#B7E7A7" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
