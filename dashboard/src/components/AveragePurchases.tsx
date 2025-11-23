import React from "react";

interface AveragePurchasesProps {
  value: number;
}

export const AveragePurchases: React.FC<AveragePurchasesProps> = ({ value }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
      <span className="text-pastel-purple text-lg font-bold mb-2">Average Purchases</span>
      <span className="text-3xl font-bold text-pastel-purple">${value.toFixed(2)}</span>
    </div>
  );
};
