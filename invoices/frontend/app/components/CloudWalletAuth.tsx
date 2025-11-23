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
      if (walletList) {
        setWallets(walletList);
        // Auto-select first wallet if available
        if (walletList.length > 0) {
          setSelectedWallet(walletList[0].address);
          onWalletConnected(walletList[0].address);
        } else {
          setError("No se encontraron Cloud Wallets. Por favor, crea una en tu instancia de MultiBaas.");
        }
      } else {
        setError("No se pudieron cargar las Cloud Wallets. Verifica tu configuración de MultiBaas.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al cargar wallets";
      console.error("Error loading cloud wallets:", error);
      setError(`Error: ${errorMessage}. Verifica que las variables de entorno estén configuradas correctamente.`);
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

  if (error) {
    return (
      <div className="wallet-auth-empty">
        <p style={{ color: "#e74c3c", marginBottom: "1rem" }}>{error}</p>
        <details style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          <summary style={{ cursor: "pointer", color: "#6C7A89" }}>Verificar configuración</summary>
          <div style={{ marginTop: "0.5rem", padding: "1rem", background: "rgba(255,255,255,0.5)", borderRadius: "8px" }}>
            <p><strong>Variables de entorno requeridas:</strong></p>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
              <li><code>NEXT_PUBLIC_MULTIBAAS_DEPLOYMENT_URL</code> - URL de tu instancia MultiBaas</li>
              <li><code>NEXT_PUBLIC_MULTIBAAS_DAPP_USER_API_KEY</code> - API Key con permisos para Cloud Wallets</li>
            </ul>
            <p style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              <strong>Nota:</strong> El API Key debe tener permisos para listar Cloud Wallets. 
              Verifica en MultiBaas: Admin → API Keys → Permisos del grupo.
            </p>
          </div>
        </details>
      </div>
    );
  }

  if (wallets.length === 0 && !isLoading) {
    return (
      <div className="wallet-auth-empty">
        <p>No se encontraron Cloud Wallets. Por favor, crea una en tu instancia de MultiBaas.</p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#6C7A89" }}>
          Ve a MultiBaas → Cloud Wallets → Crear nueva wallet
        </p>
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

