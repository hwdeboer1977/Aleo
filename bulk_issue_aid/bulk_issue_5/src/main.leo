import humanity_link_aid_v7.aleo;

program bulk_issue_5_v7.aleo {

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
        s0: Issuance, s1: Issuance, s2: Issuance, s3: Issuance, s4: Issuance
    ) -> (
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        Future
    ) {
        let (rec0, f0): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s0.recipient, s0.amount, s0.tag);
        let (rec1, f1): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s1.recipient, s1.amount, s1.tag);
        let (rec2, f2): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s2.recipient, s2.amount, s2.tag);
        let (rec3, f3): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s3.recipient, s3.amount, s3.tag);
        let (rec4, f4): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s4.recipient, s4.amount, s4.tag);
        return (rec0, rec1, rec2, rec3, rec4, finalize_bulk_issue(f0, f1, f2, f3, f4));
    }

    async function finalize_bulk_issue(
        f0: Future, f1: Future, f2: Future, f3: Future, f4: Future
    ) {
        f0.await();
        f1.await();
        f2.await();
        f3.await();
        f4.await();
    }
}
