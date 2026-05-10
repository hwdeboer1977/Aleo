// The 'oracle_leo' program.
program oracle_leo_v1.aleo {
    @noupgrade
    async constructor() {}


    // # Terminal 1: Start devnet
    // leo devnet --snarkos $(which snarkos) --snarkos-features test_network --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --clear-storage

    // 1. leo build
    // 2. leo deploy --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11

    ////////////////////////////////////////////////////////////
    // CONFIG - Whitelisted oracle addresses
    ////////////////////////////////////////////////////////////

    const ORACLE_1: address = aleo1ashyu96tjwe63u0gtnnv8z5lhapdu4l5pjsl2kha7fv7hvz2eqxs5dz0rg;
    const ORACLE_2: address = aleo12ux3gdauck0v60westgcpqj7v8rrcr3v346e4jtq04q7kkt22czsh808v2;
    const ORACLE_3: address = aleo1p9sg8gapg22p3j42tang7c8kqzp4lhe6mg77gx32yys2a5y7pq9sxh6wrd;

    ////////////////////////////////////////////////////////////
    // STORAGE
    ////////////////////////////////////////////////////////////

    mapping latest_round: field => u64;
    mapping latest_price_e8: field => u128;
    mapping latest_timestamp: field => u64;

    ////////////////////////////////////////////////////////////
    // TRANSITIONS
    ////////////////////////////////////////////////////////////

    /// Submit a price update (single TX)
    async transition submit_price(
        feed_id: field,
        round_id: u64,
        price_e8: u128,
        timestamp: u64
    ) -> Future {
        let c: address = self.caller;
        assert(c == ORACLE_1 || c == ORACLE_2 || c == ORACLE_3);

        return finalize_submit_price(feed_id, round_id, price_e8, timestamp);
    }

    async function finalize_submit_price(
        feed_id: field,
        round_id: u64,
        price_e8: u128,
        timestamp: u64
    ) {
        let last_round: u64 = Mapping::get_or_use(latest_round, feed_id, 0u64);
        assert(round_id > last_round);

        Mapping::set(latest_round, feed_id, round_id);
        Mapping::set(latest_price_e8, feed_id, price_e8);
        Mapping::set(latest_timestamp, feed_id, timestamp);
    }
}