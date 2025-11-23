import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export type FilterType = "month" | "week" | "custom";


interface FilterProps {
  filter: FilterType;
  onFilterChange: (type: FilterType) => void;
  range: { from: string; to: string };
  onRangeChange: (range: { from: string; to: string }) => void;
}


export const Filter: React.FC<FilterProps> = ({ filter, onFilterChange, range, onRangeChange }) => {
  const startDate = range.from ? new Date(range.from) : null;
  const endDate = range.to ? new Date(range.to) : null;

  return (
    <div className="flex flex-col items-start mb-6 w-full max-w-md">
      <span className="text-gray-700 font-bold mb-2">Select period:</span>
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg border transition-colors text-sm font-bold ${filter === "month" ? "bg-pastel-blue text-white" : "bg-white text-pastel-blue border-pastel-blue"}`}
          onClick={() => onFilterChange("month")}
        >
          Month
        </button>
        <button
          className={`px-4 py-2 rounded-lg border transition-colors text-sm font-bold ${filter === "week" ? "bg-pastel-green text-white" : "bg-white text-pastel-green border-pastel-green"}`}
          onClick={() => onFilterChange("week")}
        >
          Week
        </button>
        {/* Solo botones de mes y semana */}
      </div>
      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={(dates: [Date | null, Date | null]) => {
          const [start, end] = dates;
          onRangeChange({
            from: start ? start.toISOString().slice(0, 10) : "",
            to: end ? end.toISOString().slice(0, 10) : "",
          });
        }}
        dateFormat="yyyy-MM-dd"
        className="px-2 py-2 border rounded w-full"
        isClearable
        placeholderText="Select a date range"
      />
    </div>
  );
};
