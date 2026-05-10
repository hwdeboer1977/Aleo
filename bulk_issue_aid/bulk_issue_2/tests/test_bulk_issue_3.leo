// The 'test_bulk_issue_3' test program.
import bulk_issue_3.aleo;
program test_bulk_issue_3.aleo {
    @test
    script test_it() {
        let result: u32 = bulk_issue_3.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = bulk_issue_3.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }

    @noupgrade
    async constructor() {}
}
