"use client";
import React from "react";

const suggestions = [
  {
    id: 1,
    title: "Recomendar pago anticipado",
    detail: "Descuento disponible si pagas en 7 días: 1.5%",
    highlight: "1.5%",
  },
  {
    id: 2,
    title: "Alerta de cashflow",
    detail: "Se proyecta déficit en 3 días. Considerar aplazamientos.",
    highlight: "3 días",
  },
  {
    id: 3,
    title: "Mejorar score de crédito",
    detail: "Paga facturas pendientes antes de 15 días para +12 pts.",
    highlight: "+12 pts",
  },
];

const AISuggestions: React.FC = () => {
  return (
    <aside className="ai-suggestions" style={{ maxWidth: 360 }}>
      <div
        style={{
          background: "linear-gradient(180deg, #FFF7FB, #F7FFF9)",
          borderRadius: 12,
          padding: 12,
          boxShadow: "0 1px 4px rgba(16,24,40,0.04)",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 600 }}>Sugerencias de IA</h3>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {suggestions.map((s) => (
            <li
              key={s.id}
              style={{
                background: "#FFFFFF",
                borderRadius: 8,
                padding: 10,
                border: "1px solid rgba(15,23,42,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{s.title}</span>
                <span
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace",
                    background: "#FEF3C7",
                    color: "#92400E",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  {s.highlight}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#475569" }}>{s.detail}</div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default AISuggestions;
