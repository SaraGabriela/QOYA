"use client";
import React, { useState, useEffect, useCallback } from "react";
import useMultiBaas from "../hooks/useMultiBaas";

interface CloudWalletAuthProps {
  onWalletConnected: (address: string) => void;
  onWalletDisconnected: () => void;
}

const CloudWalletAuth: React.FC<CloudWalletAuthProps> = ({
  onWalletConnected,
  onWalletDisconnected,
}) => {
  const { listCloudWallets } = useMultiBaas();
  const [wallets, setWallets] = useState<Array<{ address: string; label: string }>>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadWallets = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const walletList = await listCloudWallets();
      if (walletList && walletList.length > 0) {
        setWallets(walletList);
        // Auto-select first wallet if available
        setSelectedWallet(walletList[0].address);
        onWalletConnected(walletList[0].address);
      } else {
        // This should not happen with dummy data, but handle gracefully
        setError("No se encontraron Cloud Wallets.");
      }
    } catch (error) {
      // Error handling simplified for demo - connection should always succeed with dummy data
      console.error("Error loading cloud wallets:", error);
      setError("Error al cargar wallets");
    } finally {
      setIsLoading(false);
    }
  }, [listCloudWallets, onWalletConnected]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const handleWalletChange = (address: string) => {
    setSelectedWallet(address);
    if (address) {
      onWalletConnected(address);
    } else {
      onWalletDisconnected();
    }
  };

  if (isLoading) {
    return (
      <div className="wallet-auth-loading">
        <div className="spinner"></div>
        <p>Cargando wallets...</p>
      </div>
    );
  }

  // Simplified error handling for demo - connection should always succeed
  if (error && wallets.length === 0) {
    return (
      <div className="wallet-auth-empty">
        <p style={{ color: "#e74c3c" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="wallet-auth">
      <label htmlFor="wallet-select" className="wallet-label">
        Cloud Wallet:
      </label>
      <select
        id="wallet-select"
        value={selectedWallet}
        onChange={(e) => handleWalletChange(e.target.value)}
        className="wallet-select"
      >
        <option value="">Seleccionar wallet...</option>
        {wallets.map((wallet) => (
          <option key={wallet.address} value={wallet.address}>
            {wallet.label} ({wallet.address.slice(0, 6)}...{wallet.address.slice(-4)})
          </option>
        ))}
      </select>
      {selectedWallet && (
        <div className="wallet-info">
          <p className="wallet-address">
            <strong>Dirección:</strong> <code>{selectedWallet}</code>
          </p>
        </div>
      )}
    </div>
  );
};

export default CloudWalletAuth;

