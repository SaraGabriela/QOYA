"use client";
import React, { useEffect, useState, useCallback } from "react";
import useMultiBaas from "../hooks/useMultiBaas";

interface InvoiceEvent {
  business: string;
  invoiceHash: string;
  timestamp: string;
  txHash: string;
}

interface InvoiceDashboardProps {
  cloudWalletAddress?: string;
  refreshTrigger?: string;
}

const InvoiceDashboard: React.FC<InvoiceDashboardProps> = ({
  cloudWalletAddress,
  refreshTrigger,
}) => {
  const { getInvoiceEvents } = useMultiBaas();
  const [invoices, setInvoices] = useState<InvoiceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!cloudWalletAddress) {
      setInvoices([]);
      return;
    }

    setIsLoading(true);
    try {
      const events = await getInvoiceEvents(cloudWalletAddress);
      if (events) {
        setInvoices(events);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getInvoiceEvents, cloudWalletAddress]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, refreshTrigger]);

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

