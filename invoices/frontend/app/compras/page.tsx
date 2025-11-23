"use client";

import React, { useState } from "react";
import Layout from "../components/Layout";
import CloudWalletAuth from "../components/CloudWalletAuth";
import InvoiceUploadForm from "../components/InvoiceUploadForm";
import InvoiceDashboard from "../components/InvoiceDashboard";

const ComprasPage: React.FC = () => {
  const [cloudWalletAddress, setCloudWalletAddress] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<string>("");

  const handleWalletConnected = (address: string) => {
    setCloudWalletAddress(address);
  };

  const handleWalletDisconnected = () => {
    setCloudWalletAddress("");
  };

  const handleInvoiceRegistered = (txHash: string) => {
    // Trigger refresh of dashboard
    setRefreshTrigger(Date.now().toString());
  };

  return (
    <Layout businessAddress={cloudWalletAddress}>
      <div className="compras-page">
        <div className="page-header">
          <h1 className="page-title">Compras</h1>
          <CloudWalletAuth
            onWalletConnected={handleWalletConnected}
            onWalletDisconnected={handleWalletDisconnected}
          />
        </div>

        <div className="compras-content">
          <div className="compras-section">
            <InvoiceUploadForm
              cloudWalletAddress={cloudWalletAddress}
              onInvoiceRegistered={handleInvoiceRegistered}
            />
          </div>

          <div className="compras-section">
            <InvoiceDashboard
              cloudWalletAddress={cloudWalletAddress}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComprasPage;

