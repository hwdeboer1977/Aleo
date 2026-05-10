import { NextPageWithLayout } from "@/types";
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from "@/components/ui/base";
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { SyntheticEvent, useEffect, useState } from "react";
import {
    Transaction,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';
import { getPublicBalance, ITransactionStatus } from "@/lib/utils/getPublicBalance";
import Button from "@/components/ui/button";
import { exampleInputs, findBestProgramSet, inputsPlaceholder } from "@/lib/utils/exampleInputs";





const Public2Private: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const [balance, setPublicBalance] = useState<number>(0);

  const [recipients, setRecipients] = useState<number | undefined>();
  const [total, setTotalAmount] = useState<number | undefined>();

  let [inputs, setInputs] = useState(JSON.stringify(exampleInputs));
  let [fee, setFee] = useState<number | undefined>(0);
  let [transactionId, setTransactionId] = useState<string | undefined>();
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;
      try {
        const publicBalance = await getPublicBalance(publicKey, WalletAdapterNetwork.TestnetBeta);
        setPublicBalance(publicBalance);
      } catch (err) {
        console.error("Failed to fetch public balance:", err);
      }
    };

    fetchBalance();
  }, [ publicKey ]);

  function tryParseJSON(input: string): string | object {
    try {
      return JSON.parse(input);
    } catch (error) {
      return input;
    }
  }

  const checkTransactionUntilFinalized = async (txId: string): Promise<void> => {
    if (!wallet?.adapter) return;

    const walletAdapter = wallet.adapter as LeoWalletAdapter;
    let active = true;

    while (active) {
      const status = await walletAdapter.transactionStatus(txId);
      console.log(`Transaction Status: ${status} for ${txId}`);
      switch (status) {
        case ITransactionStatus.Finalized:
          active = false;
          break;
        case ITransactionStatus.Failed:
        case ITransactionStatus.Rejected:
          console.error("Transaction failed or rejected");
          active = false;
          break;
        default:
          console.log("Transaction still in progress...");
          await new Promise((r) => setTimeout(r, 15000));
      }
    }
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();
  
    const data: Record<string, string>[] = JSON.parse(inputs);
  
    const recipientCount = data.length;
  
    setRecipients(recipientCount);
    setTotalAmount(
      data.reduce((acc: number, item) => {
        const val = Object.values(item)[0];
        return acc + (Number(val.replace('u64', '')) || 0);
      }, 0)
    );
  
    const programMapping: Record<number, string> = {
      5: "batch_public_private_5.aleo",
      10: "batch_public_private_10.aleo",
      15: "batch_public_private_15.aleo",
      20: "batch_public_private_20.aleo",
      25: "batch_public_private_25.aleo",
    };
  
    const batchSizes = Object.keys(programMapping).map(Number).sort((a, b) => a - b);
    const bestSizes = findBestProgramSet(recipientCount, batchSizes);
    const selectedProgramsList = bestSizes.map(size => programMapping[size]);
    setSelectedPrograms(selectedProgramsList);
  
    let currentIndex = 0;
  
    const result = bestSizes.map((size) => {
      const recipients = new Array<string>(size).fill(publicKey);
      const amounts = new Array<string>(size).fill("0u64");
  
      for (let i = 0; i < size && currentIndex < data.length; i++) {
        const item = data[currentIndex];
        const addr = Object.keys(item)[0];
        const val = Object.values(item)[0];
        recipients[i] = addr || publicKey;
        amounts[i] = val || "0u64";
        currentIndex++;
      }
  
      return {
        program: programMapping[size],
        recipients,
        amounts,
        total: amounts.reduce((acc, val) => acc + (Number(val.replace('u64', '')) || 0), 0),
      };
    });

    console.log("Selected Programs:", selectedPrograms);
    console.log("Resulting Transactions:", result);

    const aleoTransactions = result.map(({ program, recipients, amounts, total }) => {
      return Transaction.createTransaction(
        publicKey,
        'testnetbeta', 
        program,
        'payroll_public_private',
        [`[${amounts.join(",")}]`, `[${recipients.join(",")}]`],
        fee!,
        false
      )
    });

    console.log("Aleo Transactions:", aleoTransactions);

    const walletAdapter = wallet?.adapter as LeoWalletAdapter;

    const txIds = await walletAdapter.requestBulkTransactions(aleoTransactions)
    console.log("Transaction IDs:", txIds);
    for (const txId of txIds) {
      await checkTransactionUntilFinalized(txId);
    }
  };
  
  const handleFeeChange = (event: any) => {
    setTransactionId(undefined);
    event.preventDefault();
    setFee(event.currentTarget.value);
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Public to Private Batch Transfer</h1>
      <div><label>Wallet :</label>{`  ${publicKey}`}</div>
      <div><label>Balance:  </label>{(Number(balance) / 10**6)}</div>
      <div><label>Recipients:  </label>{recipients}</div>
      <div><label>Total Amount:  </label>{(Number(total) / 10**6)}</div>
      <div><label>Selected Programs:  </label>{selectedPrograms.join(" ")}</div>
      <div><label>Fee:  </label>{fee}</div>
      <Base>
        <form
          className="relative flex w-full flex-col rounded-full md:w-auto"
          noValidate
          role="search"
          onSubmit={async (event: SyntheticEvent<HTMLFormElement>) => {
            await handleSubmit(event);
          }}
        >
        <label className="flex w-full items-center justify-between py-4">
            Inputs:
            <textarea
                className="w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                placeholder={JSON.stringify(inputsPlaceholder)}
                rows={6}
                onChange={(event) => setInputs(event.currentTarget.value)}
                value={inputs}
            />
          </label>
          <label className="flex w-full items-center justify-between py-4">
            Fee:
            <input
              className="h-11 w-10/12 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              placeholder="Fee (in microcredits)"
              onChange={(event) => {
                let valueAsNumber = parseFloat(event.target.value);
                let value = !Number.isNaN(valueAsNumber)
                  ? valueAsNumber
                  : undefined;
                setFee(value);
              }}
              value={fee ?? ''}
            />
          </label>

          <div className="flex items-center justify-center">
            <Button
              disabled={
                !publicKey || !inputs || fee === undefined
              }
              type="submit"
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              {!publicKey ? 'Connect Your Wallet' : 'Submit'}
            </Button>
          </div>
        </form>
      </Base>
    </>
  );
};

Public2Private.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Public2Private;
