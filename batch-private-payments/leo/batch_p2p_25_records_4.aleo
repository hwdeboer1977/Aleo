import credits.aleo;

program batch_p2p_25_records_4.aleo {

    transition join_send(
        r1:  credits.aleo/credits,
        r2:  credits.aleo/credits,
        r3:  credits.aleo/credits,
        r4:  credits.aleo/credits,
        recipient_amounts:   [u64; 25],     // Fixed-length array of amounts for each recipient
        recipient_addresses: [address; 25],

    ) -> credits.aleo/credits {

        const RECIPIENTS: u8 = 25u8;

        // Merge each recipient record into the pot sequentially.
        let merged1:credits.aleo/credits = credits.aleo/join(r1, r2);
        let merged2:credits.aleo/credits = credits.aleo/join(merged1, r3);
        let merged3:credits.aleo/credits = credits.aleo/join(merged2, r4);
        
        let pot_private:credits.aleo/credits = merged3;

        // Step 4: Distribute private credits to each recipient from the converted pot
        for i: u8 in 0u8..RECIPIENTS {
            let (recipient_share, new_pot): (credits.aleo/credits, credits.aleo/credits) =
                credits.aleo/transfer_private(
                    pot_private,
                    recipient_addresses[i],
                    recipient_amounts[i],
                );
            pot_private = new_pot; // Update remaining pot after each transfer
        }

        // Step 5: Wait for both asynchronous operations (deduction + conversion) to complete
        return pot_private;
    }

}