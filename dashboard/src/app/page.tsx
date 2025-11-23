
"use client";
import { useState, useEffect } from "react";
import { Filter, FilterType } from "../components/Filter";
import { PurchasesChart } from "../components/PurchasesChart";
import { SupplierRanking } from "../components/SupplierRanking";
import { AveragePurchases } from "../components/AveragePurchases";


// Simulated purchase data (more variety)
const purchasesData = [
  { date: "2025-11-01", amount: 1200 },
  { date: "2025-11-02", amount: 800 },
  { date: "2025-11-03", amount: 950 },
  { date: "2025-11-04", amount: 1100 },
  { date: "2025-11-05", amount: 1350 },
  { date: "2025-11-06", amount: 900 },
  { date: "2025-11-07", amount: 1500 },
  { date: "2025-11-08", amount: 950 },
  { date: "2025-11-09", amount: 1050 },
  { date: "2025-11-10", amount: 1250 },
  { date: "2025-11-11", amount: 1400 },
  { date: "2025-11-12", amount: 1000 },
  { date: "2025-11-13", amount: 1150 },
  { date: "2025-11-14", amount: 1300 },
  { date: "2025-11-15", amount: 1100 },
  { date: "2025-11-16", amount: 1200 },
  { date: "2025-11-17", amount: 950 },
  { date: "2025-11-18", amount: 1250 },
  { date: "2025-11-19", amount: 1350 },
  { date: "2025-11-20", amount: 1400 },
  { date: "2025-11-21", amount: 1200 },
  { date: "2025-11-22", amount: 1300 },
];

const suppliersData = [
  { name: "Supplier A", amount: 4200 },
  { name: "Supplier B", amount: 3800 },
  { name: "Supplier C", amount: 2950 },
  { name: "Supplier D", amount: 2100 },
  { name: "Supplier E", amount: 1750 },
];

const average = Math.round(purchasesData.reduce((acc, d) => acc + d.amount, 0) / purchasesData.length * 100) / 100;

function Home() {
  const [filter, setFilter] = useState<FilterType>("month");
  const [range, setRange] = useState<{ from: string; to: string }>({ from: "2025-11-01", to: "2025-11-22" });
  const [typedTitle, setTypedTitle] = useState("");
  const fullTitle = "Purchases Dashboard";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedTitle(fullTitle.slice(0, i + 1));
      i++;
      if (i === fullTitle.length) clearInterval(interval);
    }, 70);
    return () => clearInterval(interval);
  }, []);

  // Filtrar datos según el filtro seleccionado
  let filteredPurchases = purchasesData;
  if (filter === "week") {
    filteredPurchases = purchasesData.slice(-7);
  } else if (filter === "month") {
    filteredPurchases = purchasesData.slice(-22);
  } else if (filter === "custom" && range.from && range.to) {
    filteredPurchases = purchasesData.filter(d => d.date >= range.from && d.date <= range.to);
  }
  const filteredAverage = filteredPurchases.length > 0 ? Math.round(filteredPurchases.reduce((acc, d) => acc + d.amount, 0) / filteredPurchases.length * 100) / 100 : 0;

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-6 px-2 sm:py-12 sm:px-4 bg-gradient-to-br from-pastel-blue via-pastel-purple to-pastel-pink">
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-black mb-4 drop-shadow-lg tracking-wide" style={{letterSpacing: '0.08em'}}>
          {typedTitle}
          <span className="animate-pulse text-black">|</span>
        </h1>
        <p className="text-lg text-black mb-10 font-bold">Professional statistics for your company purchases</p>
        <div className="mb-6 w-full">
          <Filter
            filter={filter}
            onFilterChange={setFilter}
            range={range}
            onRangeChange={setRange}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10 mb-8 w-full">
          <div className="rounded-2xl border-4 border-pastel-blue bg-white/80 shadow-xl w-full">
            <PurchasesChart data={filteredPurchases} filter={filter} />
          </div>
          <div className="rounded-2xl border-4 border-pastel-green bg-white/80 shadow-xl w-full">
            <SupplierRanking suppliers={suppliersData} />
          </div>
        </div>
        <div className="rounded-2xl border-4 border-pastel-purple bg-white/80 shadow-xl mb-8 w-full">
          <AveragePurchases value={filteredAverage} />
        </div>
      </div>
    </div>
  );
}

export default Home;
