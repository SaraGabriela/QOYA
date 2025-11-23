import React from "react";

interface Supplier {
  name: string;
  amount: number;
}

interface SupplierRankingProps {
  suppliers: Supplier[];
}

export const SupplierRanking: React.FC<SupplierRankingProps> = ({ suppliers }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6 min-h-[220px]">
      <span className="text-pastel-green text-lg font-bold mb-2">Top Suppliers</span>
      <ul className="mt-4">
        {suppliers.map((s, i) => (
          <li key={s.name} className="flex justify-between py-2 border-b last:border-b-0">
            <span className="font-medium text-gray-700">{i + 1}. {s.name}</span>
            <span className="text-pastel-green font-semibold">${s.amount.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
