"use client";
import type { UseWaitForTransactionReceiptReturnType } from "wagmi";
import React, { useEffect, useState, useCallback } from "react";
import useMultiBaas from "../hooks/useMultiBaas";

interface InvoiceEvent {
  business: string;
  invoiceHash: string;
  timestamp: string;
  txHash: string;
}

interface EventsProps {
  txReceipt?: UseWaitForTransactionReceiptReturnType['data'];
  cloudWalletAddress?: string;
}

const Events: React.FC<EventsProps> = ({ txReceipt, cloudWalletAddress }) => {
  const { getInvoiceEvents } = useMultiBaas();
  const [events, setEvents] = useState<InvoiceEvent[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Wrap fetchEvents with useCallback
  const fetchEvents = useCallback(async () => {
    setIsFetching(true);
    try {
      const fetchedEvents = await getInvoiceEvents(cloudWalletAddress);
      if (fetchedEvents) {
        setEvents(fetchedEvents);
      }
    } catch (error) {
      console.error("Error fetching invoice events:", error);
    } finally {
      setIsFetching(false);
    }
  }, [getInvoiceEvents, cloudWalletAddress]);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Fetch events whenever txReceipt changes
  useEffect(() => {
    if (txReceipt) {
      fetchEvents();
    }
  }, [txReceipt, fetchEvents]);

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
      <h2 className="dashboard-title">Eventos de Facturas</h2>
      <div className="spinner-parent">
        {isFetching && (
          <div className="overlay">
            <div className="spinner"></div>
          </div>
        )}
        {!isFetching && events.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron eventos de facturas.</p>
          </div>
        ) : (
          <div className="invoice-table-container">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Hash de Factura</th>
                  <th>Negocio</th>
                  <th>Fecha</th>
                  <th>Transacción</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={index}>
                    <td>
                      <code className="hash-code">{truncateHash(event.invoiceHash, 12)}</code>
                    </td>
                    <td>
                      <code className="hash-code">{truncateHash(event.business, 8)}</code>
                    </td>
                    <td className="date-cell">{formatDate(event.timestamp)}</td>
                    <td>
                      <a
                        href={`${process.env.NEXT_PUBLIC_MULTIBAAS_DEPLOYMENT_URL}/tx/${event.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-link"
                      >
                        {truncateHash(event.txHash, 8)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
