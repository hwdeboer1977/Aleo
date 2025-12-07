// The 'test_age_check' test program.
import age_check.aleo;
program test_age_check.aleo {
    @test
    script test_it() {
        let result: u32 = age_check.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = age_check.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }

    @noupgrade
    async constructor() {}
}
