import credits.aleo;

program batch_p2p_5_records_1 {

    transition join_send(
        r1:  credits.aleo/credits,
        recipient_amounts:   [u64; 5], 
        recipient_addresses: [address; 5],

    ) -> credits.aleo/credits {

        const RECIPIENTS: u8 = 5u8;

        let pot_private:credits.aleo/credits = r1;


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