import { WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";

export type GetMappingValueParams = {
  program_id: string;
  mapping_name: string;
  key: string;
  network?: WalletAdapterNetwork;
};

export type JsonRpcResponse<T = any> = {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
};

function parseAleoU64(value: string): bigint {
  const match = value.match(/^(\d+)u64$/);
  if (!match) {
    throw new Error(`Unexpected u64 format: ${value}`);
  }
  return BigInt(match[1]);
}

export async function getMappingValue({
  program_id,
  mapping_name,
  key,
  network = WalletAdapterNetwork.TestnetBeta,
}: GetMappingValueParams): Promise<bigint | string> {
  const rpcUrl = `https://${network}.aleorpc.com`;

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getMappingValue",
      params: {
        program_id,
        mapping_name,
        key,
      },
    }),
  });

  const data: JsonRpcResponse<string> = await response.json();

  if (data.error) {
    throw new Error(`RPC Error: ${data.error.message}`);
  }

  if (!data.result) {
    throw new Error("No result returned from RPC");
  }

  try {
    return parseAleoU64(data.result);
  } catch {
    return data.result;
  }
}

/**
 * Convenience method to get the public token balance for a given Aleo address.
 * @param address - Aleo address (e.g., aleo1...)
 * @returns The balance as a regular number
 */
export async function getPublicBalance(address: string, network: WalletAdapterNetwork): Promise<number> {
  const raw = await getMappingValue({
    program_id: "credits.aleo",
    mapping_name: "account",
    key: address,
    network
  });

  if (typeof raw === "bigint") {
    return Number(raw); // Only safe for values < 2^53
  }

  // If raw is a string and still looks like "12345u64", parse manually
  const match = raw.match(/^(\d+)u64$/);
  if (match) {
    return Number(match[1]);
  }

  throw new Error("Invalid balance format");
}

export enum ITransactionStatus {
    Queued = "Queued",
    Processing = "Processing",
    Broadcasting = "Broadcasting",
    Completed = "Completed",
    Failed = "Failed",
    Finalized = "Finalized",
    Rejected = "Rejected",
}
