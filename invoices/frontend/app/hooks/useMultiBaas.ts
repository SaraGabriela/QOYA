"use client";
import type { PostMethodArgs, MethodCallResponse, TransactionToSignResponse } from "@curvegrid/multibaas-sdk";
import { Configuration, ContractsApi, EventsApi, ChainsApi } from "@curvegrid/multibaas-sdk";
import { useCallback, useMemo, useState, useEffect } from "react";

interface ChainStatus {
  chainID: number;
  blockNumber: number;
}

interface CloudWallet {
  address: string;
  label: string;
}

interface InvoiceEvent {
  business: string;
  invoiceHash: string;
  timestamp: string;
  txHash: string;
  // Optional metadata captured at upload time
  amount?: string;
  provider?: string;
}

// Dummy data for simulating invoice events (Mock Read)
// Valid Ethereum address format (hexadecimal only)
const DUMMY_WALLET_ADDRESS = "0x1A2B3C4D5E6F7890ABCDEF1234567890ABCDEF12";

const DUMMY_INVOICES: InvoiceEvent[] = [
  {
    business: DUMMY_WALLET_ADDRESS.toLowerCase(),
    invoiceHash: "0xdeadbeef1234567890abcdefdeadbeef1234567890abcdefdeadbeef12345678",
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), // Hace 5 días
    txHash: "0xTxnA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0A1B2C3D4E5F6G7H8",
  },
  {
    business: DUMMY_WALLET_ADDRESS.toLowerCase(),
    invoiceHash: "0xbadef00dabcdef01234567890abcdef01234567890abcdef01234567890abcdef",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // Hace 2 días
    txHash: "0xTxnB1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8",
  },
  {
    business: DUMMY_WALLET_ADDRESS.toLowerCase(),
    invoiceHash: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    timestamp: new Date().toISOString(), // Hoy
    txHash: "0xTxnC1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8",
  },
];

// Global store for invoices to simulate indexed state across hook instances
let globalInvoices: InvoiceEvent[] = [...DUMMY_INVOICES];

// Subscribers to notify when globalInvoices updates
const invoiceSubscribers = new Set<(items: InvoiceEvent[]) => void>();

const emitInvoices = () => {
  invoiceSubscribers.forEach((cb) => {
    try {
      cb(globalInvoices);
    } catch {
      // ignore subscriber errors
    }
  });
};

interface MultiBaasHook {
  getChainStatus: () => Promise<ChainStatus | null>;
  // registerInvoice now accepts optional metadata captured from the upload form
  registerInvoice: (
    invoiceHash: string,
    cloudWalletAddress: string,
    metadata?: { amount?: string; provider?: string }
  ) => Promise<string | null>;
  // Expose a reactive snapshot of invoices for immediate UI updates
  invoices: InvoiceEvent[];
  getInvoiceEvents: (businessAddress?: string) => Promise<InvoiceEvent[] | null>;
  listCloudWallets: () => Promise<CloudWallet[] | null>;
  getCloudWalletAddress: (label: string) => Promise<string | null>;
}

const useMultiBaas = (): MultiBaasHook => {
  // Sanitize env vars (remove surrounding quotes if present)
  const mbBaseUrl = (process.env.NEXT_PUBLIC_MULTIBAAS_DEPLOYMENT_URL || "").toString().replace(/['"]/g, "").trim();
  const mbApiKey = (process.env.NEXT_PUBLIC_MULTIBAAS_DAPP_USER_API_KEY || "").toString().replace(/['"]/g, "").trim();
  const invoiceContractLabel = (process.env.NEXT_PUBLIC_MULTIBAAS_INVOICE_CONTRACT_LABEL || "invoice_registry").toString().replace(/['"]/g, "").trim();
  const invoiceAddressAlias = (process.env.NEXT_PUBLIC_MULTIBAAS_INVOICE_ADDRESS_ALIAS || "invoice_registry").toString().replace(/['"]/g, "").trim();

  // Use the chain id configured in the frontend env, fallback to 'ethereum'
  const chain = (process.env.NEXT_PUBLIC_MULTIBAAS_CHAIN_ID || "ethereum").toString().replace(/['"]/g, "") as "ethereum" | string;

  // Memoize mbConfig
  // Using API v1 as per latest MultiBaas documentation
  const mbConfig = useMemo(() => {
    return new Configuration({
      basePath: new URL("/api/v1", mbBaseUrl).toString(),
      accessToken: mbApiKey,
    });
  }, [mbBaseUrl, mbApiKey]);

  // Memoize Api
  const contractsApi = useMemo(() => new ContractsApi(mbConfig), [mbConfig]);
  const eventsApi = useMemo(() => new EventsApi(mbConfig), [mbConfig]);
  const chainsApi = useMemo(() => new ChainsApi(mbConfig), [mbConfig]);

  const getChainStatus = async (): Promise<ChainStatus | null> => {
    try {
      const response = await chainsApi.getChainStatus(chain as "ethereum");
      return response.data.result as ChainStatus;
    } catch (err) {
      console.error("Error getting chain status:", err);
      return null;
    }
  };

  const registerInvoice = useCallback(async (
    invoiceHash: string,
    cloudWalletAddress: string,
    metadata?: { amount?: string; provider?: string }
  ): Promise<string | null> => {
    try {
      // REAL IMPLEMENTATION: Call MultiBaas API to register invoice on-chain
      // When using Cloud Wallet, MultiBaas will automatically sign and submit the transaction
      // if we provide the 'from' field with a Cloud Wallet address
      const payload: PostMethodArgs = {
        args: [invoiceHash],
        from: cloudWalletAddress,
      };

      const response = await contractsApi.callContractFunction(
        chain as "ethereum",
        invoiceAddressAlias,
        invoiceContractLabel,
        "registerInvoice",
        payload
      );

      // If it's a TransactionToSignResponse, MultiBaas has submitted it via Cloud Wallet
      const result = response.data.result as MethodCallResponse | TransactionToSignResponse;
      if (result.kind === "TransactionToSignResponse") {
        // The transaction has been submitted, we can get the txHash from the response
        // Note: The actual txHash might be available after the transaction is mined
        const txResponse = result as TransactionToSignResponse;
        const txObj = txResponse as unknown as { txHash?: string; tx?: { hash?: string } };
        const txHash = txObj.txHash || txObj.tx?.hash || `0x${Math.random().toString(16).substr(2, 64)}`;
        
        // Add the newly registered invoice to the dummy list for immediate UI update
        // This simulates the event being indexed immediately
        const newInvoice: InvoiceEvent = {
          business: cloudWalletAddress.toLowerCase(),
          invoiceHash,
          timestamp: new Date().toISOString(),
          txHash,
          amount: metadata?.amount,
          provider: metadata?.provider,
        };

        // Update global invoices and notify subscribers for immediate UI update
        globalInvoices = [newInvoice, ...globalInvoices];
        emitInvoices();
        
        return txHash;
      }

      // If it's a MethodCallResponse, it was a read operation (shouldn't happen here)
      throw new Error("Unexpected response type for write operation");
    } catch (err) {
      console.error("Error registering invoice:", err);
      return null;
    }
  }, [contractsApi, chain, invoiceAddressAlias, invoiceContractLabel]);

  const getInvoiceEvents = useCallback(async (businessAddress?: string): Promise<InvoiceEvent[] | null> => {
    // If real MultiBaas is configured, try to fetch indexed events from the API
    const isConfigured = Boolean(mbBaseUrl && mbApiKey);

    if (isConfigured) {
      try {
        const eventSignature = "InvoiceRegistered(address,bytes32,uint256)";
        const response = await eventsApi.listEvents(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
          chain as "ethereum",
          invoiceAddressAlias,
          invoiceContractLabel,
          eventSignature,
          100
        );

        if (!response.data.result) {
          return [];
        }

        type RawEvent = {
          event?: { inputs?: Array<{ name?: string; value?: unknown }> };
          topics?: string[];
          transaction?: { txHash?: string; tx?: { hash?: string } } | { txHash?: string };
        };

        const raw = response.data.result as unknown;
        if (!Array.isArray(raw)) return [];

        const events = (raw as RawEvent[]).map((event) => {
          let business = "";
          let invoiceHash = "";
          let timestamp: unknown = "";

          // Try to parse inputs
          const inputs = event.event?.inputs;
          if (Array.isArray(inputs)) {
            for (const input of inputs) {
              const name = input?.name as string | undefined;
              const value = input?.value as unknown;
              if (name === "business" && typeof value === "string") business = value;
              if (name === "invoiceHash" && typeof value === "string") invoiceHash = value;
              if (name === "timestamp" && (typeof value === "string" || typeof value === "number")) timestamp = value;
            }
          }

          // Fallback to topics for indexed params
          if (!business && Array.isArray(event.topics) && event.topics.length > 1) business = event.topics[1] || "";
          if (!invoiceHash && Array.isArray(event.topics) && event.topics.length > 2) invoiceHash = event.topics[2] || "";

          const timestampValue = timestamp
            ? (typeof timestamp === "string" ? parseInt(timestamp) : (typeof timestamp === "number" ? timestamp : 0))
            : 0;

          const tx = event.transaction as RawEvent['transaction'] | undefined;
          let txHashStr = "";
          if (tx) {
            if ("txHash" in tx && typeof tx.txHash === "string") {
              txHashStr = tx.txHash;
            } else if ("tx" in tx && tx.tx && typeof tx.tx.hash === "string") {
              txHashStr = tx.tx.hash;
            }
          }

          return {
            business: business.toLowerCase(),
            invoiceHash,
            timestamp: timestampValue > 0 ? new Date(timestampValue * 1000).toISOString() : new Date().toISOString(),
            txHash: txHashStr,
          } as InvoiceEvent;
        });

        if (businessAddress) {
          return events.filter((ev) => ev.business.toLowerCase() === businessAddress.toLowerCase());
        }

        return events;
      } catch (err) {
        console.error("Error fetching events from MultiBaas, falling back to mock:", err);
        // Fall through to mock below
      }
    }

    // Fallback to the local simulated store
    return new Promise((resolve) => {
      setTimeout(() => {
        const allInvoices = [...globalInvoices];
        if (businessAddress) {
          const filtered = allInvoices.filter((event: InvoiceEvent) =>
            event.business.toLowerCase() === businessAddress.toLowerCase()
          );
          resolve(filtered);
        } else {
          resolve(allInvoices);
        }
      }, 200);
    });

    /* REAL IMPLEMENTATION (commented for demo):
    try {
      const eventSignature = "InvoiceRegistered(address,bytes32,uint256)";
      const response = await eventsApi.listEvents(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        chain as "ethereum",
        invoiceAddressAlias,
        invoiceContractLabel,
        eventSignature,
        100
      );

      if (!response.data.result) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const events = response.data.result.map((event: any) => {
        // Handle indexed and non-indexed parameters
        // Indexed parameters (business, invoiceHash) might be in topics or inputs
        // Non-indexed parameters (timestamp) are in inputs
        let business = "";
        let invoiceHash = "";
        let timestamp = "";

        // Try to find in inputs first
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event.event?.inputs?.forEach((input: any) => {
          if (input.name === "business") business = input.value || "";
          if (input.name === "invoiceHash") invoiceHash = input.value || "";
          if (input.name === "timestamp") timestamp = input.value || "";
        });

        // If not found in inputs, check topics (for indexed parameters)
        if (!business && event.topics && event.topics.length > 1) {
          // topics[0] is the event signature hash, topics[1] is first indexed param (business)
          business = event.topics[1] || "";
        }
        if (!invoiceHash && event.topics && event.topics.length > 2) {
          // topics[2] is second indexed param (invoiceHash)
          invoiceHash = event.topics[2] || "";
        }

        // Parse timestamp (it's a uint256, so it might be a string or number)
        const timestampValue = timestamp ? (typeof timestamp === "string" ? parseInt(timestamp) : timestamp) : 0;
        
        return {
          business: business.toLowerCase(),
          invoiceHash,
          timestamp: timestampValue > 0 ? new Date(timestampValue * 1000).toISOString() : new Date().toISOString(),
          txHash: event.transaction?.txHash || "",
        };
      });

      // Filter by business address if provided
      if (businessAddress) {
        return events.filter((event: InvoiceEvent) => 
          event.business.toLowerCase() === businessAddress.toLowerCase()
        );
      }

      return events;
    } catch (err) {
      console.error("Error getting invoice events:", err);
      return null;
    }
    */
  }, [eventsApi, chain, invoiceAddressAlias, invoiceContractLabel, mbBaseUrl, mbApiKey]);

  const listCloudWallets = useCallback(async (): Promise<CloudWallet[] | null> => {
    // If MultiBaas deployment URL and API key are configured, call the real Cloud Wallets endpoint
    const basePath = mbBaseUrl ? new URL("/api/v1", mbBaseUrl).toString() : undefined;
    if (basePath && mbApiKey) {
      try {
        const apiUrl = `${basePath}/cloud-wallets`;
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${mbApiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Cloud Wallets API error ${response.status}: ${text}`);
        }

        const data = await response.json();
        if (!data || !data.result) return [];

        type RawWallet = { address?: string; label?: string };
        const raw = data.result as unknown;
        if (!Array.isArray(raw)) return [];

        return (raw as RawWallet[]).map((w) => ({ address: w.address || "", label: w.label || "" }));
      } catch (err) {
        console.error("Error listing cloud wallets from MultiBaas:", err);
        // fallback to mock
      }
    }

    // MOCK fallback
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            address: DUMMY_WALLET_ADDRESS,
            label: "Mi Negocio - Cloud Wallet",
          },
        ]);
      }, 500); // Simulate network delay
    });

    /* REAL IMPLEMENTATION (commented for demo):
    try {
      // Validate configuration
      if (!mbBaseUrl || !mbApiKey) {
        throw new Error("MultiBaas configuration missing. Please set NEXT_PUBLIC_MULTIBAAS_DEPLOYMENT_URL and NEXT_PUBLIC_MULTIBAAS_DAPP_USER_API_KEY");
      }

      // Use direct HTTP call since CloudWalletsApi is not exported from the SDK
      // Using API v1 as per latest MultiBaas documentation
      const basePath = new URL("/api/v1", mbBaseUrl).toString();
      const apiUrl = `${basePath}/cloud-wallets`;
      
      console.debug("Fetching cloud wallets from:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${mbApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (response.status === 401) {
          errorMessage = "Authentication failed. Please check your API key.";
        } else if (response.status === 403) {
          errorMessage = "Access denied. Your API key may not have permissions to list Cloud Wallets.";
        } else if (response.status === 404) {
          errorMessage = "Endpoint not found. The API version or endpoint may be incorrect.";
        } else {
          errorMessage = `Error ${response.status}: ${errorText || "Unknown error"}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data || !data.result) {
        console.warn("Unexpected response format:", data);
        return [];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.result.map((wallet: any) => ({
        address: wallet.address,
        label: wallet.label,
      }));
    } catch (err) {
      console.error("Error listing cloud wallets:", err);
      // Re-throw to allow component to handle the error
      throw err;
    }
    */
  }, [mbBaseUrl, mbApiKey]);

  const getCloudWalletAddress = useCallback(async (label: string): Promise<string | null> => {
    try {
      const wallets = await listCloudWallets();
      const wallet = wallets?.find((w) => w.label === label);
      return wallet?.address || null;
    } catch (err) {
      console.error("Error getting cloud wallet address:", err);
      return null;
    }
  }, [listCloudWallets]);

  // Reactive invoices state inside the hook instance (subscribes to global updates)
  const [invoices, setInvoices] = useState<InvoiceEvent[]>(globalInvoices);

  useEffect(() => {
    const cb = (items: InvoiceEvent[]) => setInvoices(items);
    invoiceSubscribers.add(cb);
    // Ensure current value is in state
    setInvoices(globalInvoices);
    return () => {
      invoiceSubscribers.delete(cb);
    };
  }, []);

  return {
    getChainStatus,
    registerInvoice,
    invoices,
    getInvoiceEvents,
    listCloudWallets,
    getCloudWalletAddress,
  };
};

export default useMultiBaas;
