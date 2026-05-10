import credits.aleo;

program batch_p2p_10_records_3 {

    transition join_send(
        r1:  credits.aleo/credits,
        r2:  credits.aleo/credits,
        r3:  credits.aleo/credits,
        recipient_amounts:   [u64; 10], 
        recipient_addresses: [address; 10],

    ) -> credits.aleo/credits {

        const RECIPIENTS: u8 = 10u8;

        let merged1:credits.aleo/credits = credits.aleo/join(r1, r2);
        let merged2:credits.aleo/credits = credits.aleo/join(merged1, r3);
        let pot_private:credits.aleo/credits = merged2;


        for i: u8 in 0u8..RECIPIENTS {
            let (recipient_share, new_pot): (credits.aleo/credits, credits.aleo/credits) =
                credits.aleo/transfer_private(
                    pot_private,
                    recipient_addresses[i],
                    recipient_amounts[i],
                );
            pot_private = new_pot;
        }

        return pot_private;
    }

}