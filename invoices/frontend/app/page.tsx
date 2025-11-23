"use client";

import React, { useState } from "react";
import Layout from "./components/Layout";
import CloudWalletAuth from "./components/CloudWalletAuth";
import InvoiceDashboard from "./components/InvoiceDashboard";

const Dashboard: React.FC = () => {
  const [cloudWalletAddress, setCloudWalletAddress] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<string>("");

  const handleWalletConnected = (address: string) => {
    setCloudWalletAddress(address);
  };

  const handleWalletDisconnected = () => {
    setCloudWalletAddress("");
  };

  return (
    <Layout businessAddress={cloudWalletAddress}>
      <div className="dashboard-page">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <CloudWalletAuth
            onWalletConnected={handleWalletConnected}
            onWalletDisconnected={handleWalletDisconnected}
          />
        </div>
        
        <div className="dashboard-content">
          <InvoiceDashboard
            cloudWalletAddress={cloudWalletAddress}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
