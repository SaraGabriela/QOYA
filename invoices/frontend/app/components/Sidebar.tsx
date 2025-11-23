"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  businessAddress?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ businessAddress }) => {
  const pathname = usePathname();

  const menuItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/compras", label: "Compras", icon: "🛒" },
    { path: "/ventas", label: "Ventas", icon: "💰", disabled: true },
    { path: "/inventario", label: "Inventario", icon: "📦", disabled: true },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">QOYA</h2>
        {businessAddress && (
          <p className="sidebar-address" title={businessAddress}>
            {businessAddress.slice(0, 6)}...{businessAddress.slice(-4)}
          </p>
        )}
      </div>
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.disabled ? "#" : item.path}
                className={`sidebar-link ${
                  pathname === item.path ? "active" : ""
                } ${item.disabled ? "disabled" : ""}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.disabled && (
                  <span className="sidebar-badge">Próximamente</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

