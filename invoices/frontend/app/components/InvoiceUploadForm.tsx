"use client";
import React, { useState, useRef } from "react";
import useMultiBaas from "../hooks/useMultiBaas";

interface InvoiceUploadFormProps {
  cloudWalletAddress: string;
  onInvoiceRegistered?: (txHash: string) => void;
}

const InvoiceUploadForm: React.FC<InvoiceUploadFormProps> = ({
  cloudWalletAddress,
  onInvoiceRegistered,
}) => {
  const { registerInvoice } = useMultiBaas();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invoiceHash, setInvoiceHash] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate SHA-256 hash of file
  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Por favor, selecciona un archivo PDF");
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const hash = await calculateFileHash(file);
      setInvoiceHash(hash);
    } catch (error) {
      console.error("Error calculating hash:", error);
      alert("Error al calcular el hash del archivo");
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !invoiceHash) {
      alert("Por favor, selecciona un archivo PDF primero");
      return;
    }

    if (!cloudWalletAddress) {
      alert("Por favor, conecta tu Cloud Wallet primero");
      return;
    }

    setIsUploading(true);

    try {
      const txHash = await registerInvoice(invoiceHash, cloudWalletAddress);
      
      if (txHash) {
        alert(`Factura registrada exitosamente! Hash de transacción: ${txHash}`);
        setSelectedFile(null);
        setInvoiceHash("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (onInvoiceRegistered) {
          onInvoiceRegistered(txHash);
        }
      } else {
        alert("Error al registrar la factura. Por favor, intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error registering invoice:", error);
      alert("Error al registrar la factura");
    } finally {
      setIsUploading(false);
    }
  };
            const txHash = await registerInvoice(invoiceHash, cloudWalletAddress, {
              amount,
              provider,
            });
  return (
    <div className="invoice-upload-form">
      <h2 className="form-title">Tokenizar Factura</h2>
      <form onSubmit={handleSubmit} className="form">
              setAmount("");
              setProvider("");
        <div className="form-group">
          <label htmlFor="pdf-file" className="form-label">
            Seleccionar archivo PDF
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="pdf-file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={isProcessing || isUploading}
            className="form-input-file"
          />
          {selectedFile && (
            <p className="form-file-name">
              Archivo seleccionado: {selectedFile.name}
            </p>
          )}
        </div>

        {isProcessing && (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <p>Calculando hash del archivo...</p>
          </div>
        )}

        {invoiceHash && !isProcessing && (
          <div className="form-group">
            <label className="form-label">Hash de la factura:</label>
            <div className="hash-display">{invoiceHash}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={!invoiceHash || isProcessing || isUploading || !cloudWalletAddress}
          className="form-submit-button"
        >
          {isUploading ? "Registrando..." : "Registrar Factura"}
        </button>
      </form>
    </div>
  );
};

export default InvoiceUploadForm;

              <div className="form-group">
                <label className="form-label">Proveedor</label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="Nombre del proveedor"
                  className="form-input"
                  disabled={isUploading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Monto</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej: 1000 ARS"
                  className="form-input"
                  disabled={isUploading}
                />
              </div>

