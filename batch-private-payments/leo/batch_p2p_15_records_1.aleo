import credits.aleo;

program batch_p2p_15_records_1.aleo {

    transition join_send(
        r1:  credits.aleo/credits,
        recipient_amounts:   [u64; 15],     // Fixed-length array of amounts for each recipient
        recipient_addresses: [address; 15],

    ) -> credits.aleo/credits {

        const RECIPIENTS: u8 = 15u8;

        let pot_private:credits.aleo/credits = r1;


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