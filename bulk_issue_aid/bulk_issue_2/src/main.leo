import humanity_link_aid_v7.aleo;

program bulk_issue_2_v7.aleo {

    struct Issuance {
        recipient: address,
        amount: u64,
        tag: u8,
    }

    @custom
    async constructor() {
        admin = self.program_owner;
    }

    storage admin: address;

    async transition bulk_issue(
        s0: Issuance, s1: Issuance
    ) -> (
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        Future
    ) {
        let (rec0, f0): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s0.recipient, s0.amount, s0.tag);
        let (rec1, f1): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s1.recipient, s1.amount, s1.tag);
        return (rec0, rec1, finalize_bulk_issue(f0, f1));
    }

    async function finalize_bulk_issue(f0: Future, f1: Future) {
        f0.await();
        f1.await();
    }
}
