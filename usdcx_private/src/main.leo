// usdcx_private.aleo
// Minimal test: calls transfer_private on test_usdcx_stablecoin.aleo
// [MerkleProof; 2] passed as explicit input — Shield injects it for self.signer

import test_usdcx_stablecoin.aleo;

program usdcx_private.aleo {

    @noupgrade
    async constructor() {}

    async transition private_send(
        token: test_usdcx_stablecoin.aleo/Token,
        to: address,
        amount: u64,
        proof: [MerkleProof; 2],
    ) -> (
        test_usdcx_stablecoin.aleo/ComplianceRecord,
        test_usdcx_stablecoin.aleo/Token,
        test_usdcx_stablecoin.aleo/Token,
        Future
    ) {
        let (compliance, change, recipient_token, fut):
            (test_usdcx_stablecoin.aleo/ComplianceRecord,
             test_usdcx_stablecoin.aleo/Token,
             test_usdcx_stablecoin.aleo/Token,
             Future) =
            test_usdcx_stablecoin.aleo/transfer_private(
                to,
                amount as u128,
                token,
                proof,
            );

        return (compliance, change, recipient_token, finalize_send(fut));
    }

    async function finalize_send(fut: Future) {
        fut.await();
    }
}
