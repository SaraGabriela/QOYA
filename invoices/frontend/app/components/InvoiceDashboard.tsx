"use client";
import React, { useEffect, useState } from "react";
import useMultiBaas from "../hooks/useMultiBaas";
import AISuggestions from "./AISuggestions";

interface InvoiceEvent {
  business: string;
  invoiceHash: string;
  timestamp: string;
  txHash: string;
  amount?: string;
  provider?: string;
}

interface InvoiceDashboardProps {
  cloudWalletAddress?: string;
  refreshTrigger?: string;
}

const InvoiceDashboard: React.FC<InvoiceDashboardProps> = ({
  cloudWalletAddress,
  refreshTrigger,
}) => {
  const { invoices: allInvoices, getInvoiceEvents } = useMultiBaas();
  const [invoices, setInvoices] = useState<InvoiceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Keep a lightweight fetch for initial load if needed, but rely on reactive `allInvoices`
  useEffect(() => {
    const load = async () => {
      if (!cloudWalletAddress) {
        setInvoices([]);
        return;
      }

      setIsLoading(true);
      try {
        // Optionally warm the list from the API/mock
        await getInvoiceEvents(cloudWalletAddress);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [cloudWalletAddress, getInvoiceEvents]);

  // Reactively update when the global invoices snapshot changes
  useEffect(() => {
    if (!cloudWalletAddress) {
      setInvoices([]);
      return;
    }

    const filtered = allInvoices.filter((i) => i.business.toLowerCase() === cloudWalletAddress.toLowerCase());
    setInvoices(filtered);
  }, [allInvoices, cloudWalletAddress, refreshTrigger]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateHash = (hash: string, length: number = 10) => {
    if (hash.length <= length * 2 + 2) return hash;
    return `${hash.slice(0, length + 2)}...${hash.slice(-length)}`;
  };

  return (
    <div className="invoice-dashboard">
      <h2 className="dashboard-title">Facturas Tokenizadas</h2>
          {cloudWalletAddress && (
            <div style={{ margin: "12px 0 18px 0" }}>
              <AISuggestions />
            </div>
          )}
      {!cloudWalletAddress ? (
        <div className="empty-state">
          <p>Conecta tu Cloud Wallet para ver tus facturas</p>
        </div>
      ) : isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando facturas...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <p>No hay facturas registradas aún</p>
        </div>
      ) : (
        <div className="invoice-table-container">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Hash de Factura</th>
                <th>Fecha</th>
                <th>Transacción</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, index) => (
                <tr key={index}>
                  <td>
                    <code className="hash-code">{truncateHash(invoice.invoiceHash, 12)}</code>
                  </td>
                  <td className="date-cell">{formatDate(invoice.timestamp)}</td>
                  <td>
                    <a
                      href={`${process.env.NEXT_PUBLIC_MULTIBAAS_DEPLOYMENT_URL}/tx/${invoice.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      {truncateHash(invoice.txHash, 8)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceDashboard;

