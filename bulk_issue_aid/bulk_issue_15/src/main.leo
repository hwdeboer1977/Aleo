import humanity_link_aid_v7.aleo;

program bulk_issue_15_v7.aleo {

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
        s0: Issuance, s1: Issuance, s2: Issuance, s3: Issuance,
        s4: Issuance, s5: Issuance, s6: Issuance, s7: Issuance,
        s8: Issuance, s9: Issuance, s10: Issuance, s11: Issuance,
        s12: Issuance, s13: Issuance, s14: Issuance
    ) -> (
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        humanity_link_aid_v7.aleo/AidRecord,
        Future
    ) {
        let (rec0,  f0):  (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s0.recipient,  s0.amount,  s0.tag);
        let (rec1,  f1):  (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s1.recipient,  s1.amount,  s1.tag);
        let (rec2,  f2):  (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s2.recipient,  s2.amount,  s2.tag);
        let (rec3,  f3):  (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s3.recipient,  s3.amount,  s3.tag);
        let (rec4,  f4):  (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s4.recipient,  s4.amount,  s4.tag);
        let (rec5,  f5):  (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s5.recipient,  s5.amount,  s5.tag);
        let (rec6,  f6):  (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s6.recipient,  s6.amount,  s6.tag);
        let (rec7,  f7):  (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s7.recipient,  s7.amount,  s7.tag);
        let (rec8,  f8):  (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s8.recipient,  s8.amount,  s8.tag);
        let (rec9,  f9):  (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s9.recipient,  s9.amount,  s9.tag);
        let (rec10, f10): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s10.recipient, s10.amount, s10.tag);
        let (rec11, f11): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s11.recipient, s11.amount, s11.tag);
        let (rec12, f12): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s12.recipient, s12.amount, s12.tag);
        let (rec13, f13): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s13.recipient, s13.amount, s13.tag);
        let (rec14, f14): (humanity_link_aid_v7.aleo/AidRecord, Future) = humanity_link_aid_v7.aleo/issue_aid(s14.recipient, s14.amount, s14.tag);
        return (
            rec0, rec1, rec2, rec3, rec4, rec5, rec6, rec7,
            rec8, rec9, rec10, rec11, rec12, rec13, rec14,
            finalize_bulk_issue(f0, f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14)
        );
    }

    async function finalize_bulk_issue(
        f0: Future, f1: Future, f2: Future, f3: Future, f4: Future,
        f5: Future, f6: Future, f7: Future, f8: Future, f9: Future,
        f10: Future, f11: Future, f12: Future, f13: Future, f14: Future
    ) {
        f0.await();  f1.await();  f2.await();  f3.await();  f4.await();
        f5.await();  f6.await();  f7.await();  f8.await();  f9.await();
        f10.await(); f11.await(); f12.await(); f13.await(); f14.await();
    }
}
