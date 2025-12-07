// # Example: born in 2000, check in 2025 → true
// leo run prove_age 2000u16 2025u16 18u16
// birth_year will be provided privately at execution time
// current_year is provided as a public input so verifiers know *what* was checked
// The function returns a PUBLIC boolean so anyone can read the result.

// leo run prove_region 1u16 1u16 
// leo run prove_multi_region 1u16 1u16 2u16 3u16
// leo run prove_employment_status 1u16 1u16
// leo run prove_income_range 1000u64 100u64 10000u64 
// leo run prove_work_history 1u16 1u16
// leo run prove_displacement_status 2u16 2u16
// leo run prove_household_size 5u16 2u16
// leo run prove_vulnerability_status 1u16 1u16
// leo run prove_housing_status 1u16 1u16
// leo run prove_food_security 3u16 2u16
// leo run prove_time_since_last_aid 45u16 30u16

// To deploy: leo deploy --broadcast



program zk_humanity_link_all_checks.aleo {
    
    // Age verification - proves age >= minimum_age
    transition prove_age(
        birth_year: u16,
        public current_year: u16,
        public minimum_age: u16
    ) -> bool {
        assert(birth_year <= current_year);
        let age: u16 = current_year - birth_year;
        return age >= minimum_age;
    }
    
    // Region/country verification
    transition prove_region(
        region_code: u16,  // Private - ISO 3166-1 numeric
        public allowed_region: u16
    ) -> bool {
        return region_code == allowed_region;
    }
    
    // Multi-region check
    transition prove_multi_region(
        region_code: u16,  // Private
        public region1: u16,
        public region2: u16,
        public region3: u16
    ) -> bool {
        return region_code == region1 || 
               region_code == region2 || 
               region_code == region3;
    }
    
    // Employment status verification
    transition prove_employment_status(
        status_code: u16,  // Private: 1=employed, 2=unemployed, 3=self-employed, 4=unable_to_work
        public required_status: u16
    ) -> bool {
        return status_code == required_status;
    }
    
    // Income range verification
    transition prove_income_range(
        annual_income: u64,  // Private
        public min_income: u64,
        public max_income: u64
    ) -> bool {
        return annual_income >= min_income && annual_income <= max_income;
    }
    
    // Work history verification
    transition prove_work_history(
        months_worked: u16,  // Private
        public minimum_months: u16
    ) -> bool {
        return months_worked >= minimum_months;
    }

    // ===== HUMANITARIAN AID SPECIFIC CHECKS =====
    
    // Displacement/refugee status
    transition prove_displacement_status(
        status_code: u16,  // Private: 1=local, 2=IDP, 3=refugee, 4=asylum_seeker
        public required_status: u16
    ) -> bool {
        return status_code == required_status;
    }
    
    // Household size verification
    transition prove_household_size(
        household_size: u16,  // Private: actual number of people
        public minimum_size: u16
    ) -> bool {
        return household_size >= minimum_size;
    }
    
    // Vulnerability markers
    transition prove_vulnerability_status(
        vulnerability_code: u16,  // Private: 1=elderly, 2=disabled, 3=unaccompanied_minor, 4=pregnant, 5=chronic_illness
        public required_vulnerability: u16
    ) -> bool {
        return vulnerability_code == required_vulnerability;
    }
    
    // Housing status
    transition prove_housing_status(
        housing_code: u16,  // Private: 1=homeless, 2=temporary_shelter, 3=refugee_camp, 4=housed
        public required_status: u16
    ) -> bool {
        return housing_code == required_status;
    }
    
    // Food security level
    transition prove_food_security(
        days_without_food: u16,  // Private: number of days in past month without adequate food
        public minimum_days: u16  // Prove hardship level
    ) -> bool {
        return days_without_food >= minimum_days;
    }
    
    // Time-bound eligibility - proves enough time passed since last aid
    transition prove_time_since_last_aid(
        days_since_last_aid: u16,  // Private
        public minimum_days: u16  // Public: required waiting period
    ) -> bool {
        return days_since_last_aid >= minimum_days;
    }
}