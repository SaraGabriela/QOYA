"use client";
import React from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  businessAddress?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, businessAddress }) => {
  return (
    <div className="app-container">
      <Sidebar businessAddress={businessAddress} />
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;

