"use client";
import type { PostMethodArgs, MethodCallResponse, TransactionToSignResponse } from "@curvegrid/multibaas-sdk";
import { Configuration, ContractsApi, EventsApi, ChainsApi } from "@curvegrid/multibaas-sdk";
import { useCallback, useMemo } from "react";

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
}

interface MultiBaasHook {
  getChainStatus: () => Promise<ChainStatus | null>;
  registerInvoice: (invoiceHash: string, cloudWalletAddress: string) => Promise<string | null>;
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
  const mbConfig = useMemo(() => {
    return new Configuration({
      basePath: new URL("/api/v0", mbBaseUrl).toString(),
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

  const registerInvoice = useCallback(async (invoiceHash: string, cloudWalletAddress: string): Promise<string | null> => {
    try {
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
        // For now, we'll return a placeholder or check the response structure
        const txResponse = result as TransactionToSignResponse;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (txResponse as unknown as { txHash?: string; tx?: { hash?: string } }).txHash || txResponse.tx?.hash || "submitted";
      }

      // If it's a MethodCallResponse, it was a read operation (shouldn't happen here)
      throw new Error("Unexpected response type for write operation");
    } catch (err) {
      console.error("Error registering invoice:", err);
      return null;
    }
  }, [contractsApi, chain, invoiceAddressAlias, invoiceContractLabel]);

  const getInvoiceEvents = useCallback(async (businessAddress?: string): Promise<InvoiceEvent[] | null> => {
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
  }, [eventsApi, chain, invoiceAddressAlias, invoiceContractLabel]);

  const listCloudWallets = useCallback(async (): Promise<CloudWallet[] | null> => {
    try {
      // Use direct HTTP call since CloudWalletsApi is not exported from the SDK
      // Use the same basePath structure as other APIs
      const basePath = new URL("/api/v0", mbBaseUrl).toString();
      const apiUrl = `${basePath}/cloud-wallets`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${mbApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.result?.map((wallet: any) => ({
        address: wallet.address,
        label: wallet.label,
      })) || null;
    } catch (err) {
      console.error("Error listing cloud wallets:", err);
      return null;
    }
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

  return {
    getChainStatus,
    registerInvoice,
    getInvoiceEvents,
    listCloudWallets,
    getCloudWalletAddress,
  };
};

export default useMultiBaas;
