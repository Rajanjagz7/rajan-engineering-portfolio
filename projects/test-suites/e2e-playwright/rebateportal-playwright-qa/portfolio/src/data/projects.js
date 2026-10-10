export const projects = [
  {
    id: "rebateportal-playwright",
    title: "RebatePortal NSW — Full-Stack QA & Security Audit",
    subtitle: "Independent QA engagement: exploratory testing, API security auditing, and field-level boundary-value testing on a live government energy-rebate admin platform",
    category: "security-audit",
    featured: true,
    badge: "QA & Security Engagement",
    period: "Sep 2026",
    summary: "Ran a full QA pass on RebatePortal's redesigned NSW staging admin panel end-to-end: hands-on exploratory testing of every module, a maintained Playwright/pytest regression suite, a dedicated API security audit (session lifecycle, CORS, injection, brute-force), and a systematic field-level boundary-value testing protocol against the job-creation API. Delivered a severity-ranked defect register of 60 tracked issues, including two Critical findings reported directly to the team.",
    scopeOfWork: [
      "Exploratory UI testing across every admin module — Dashboard, Jobs, Installers, Installer Users, Notes, Matrix, Admin Users, Rebates, Invoices, CMS — logging API errors, console errors, and broken states on load, search, and pagination for each.",
      "Full validation-matrix testing of the Add Job wizard: email/phone/ABN-ACN/postcode/date formats, boundary lengths, Unicode & special-character input, duplicate-job detection, and multi-product equipment blocks.",
      "Built and maintained a pytest + Playwright regression suite (job creation, notes, soft delete, post-sign editing, field boundaries) with reusable page-object-style helpers and env-driven config.",
      "API security audit: session lifecycle (login/logout/refresh/token forgery), CORS policy, security headers, brute-force throttling, error-message enumeration, and injection resistance across the admin REST API.",
      "Field-level boundary-value & type-representation protocol run directly against POST /jobs — inventoried every field's real constraints from live validation errors, then tested min/max boundaries, null vs empty vs omitted, malformed JSON, and mass-assignment attempts, with a read-back + record-count check after every write.",
      "Found, safely reproduced, and reported a Critical stored XSS (unsanitised HTML in the Notes feature) and a Critical platform-wide defect where every \"Save\" control silently fails to persist.",
      "Produced and kept current a severity/priority-ranked defect register (Markdown + CSV, Jira-import-ready) auto-generated from a single source of truth, plus test-data hygiene tooling to replace and clean up records created during testing."
    ],
    metrics: [
      { label: "Defects Logged", value: "60" },
      { label: "Critical Findings", value: "2" },
      { label: "API Security Checks", value: "30+" },
      { label: "Boundary-Value Cases", value: "250+" }
    ],
    tags: ["Playwright", "Python", "Pytest", "API Security Testing", "Boundary-Value Testing", "TypeScript", "Bug Tracking", "REST API"],
    highlights: [
      "Discovered a Critical stored XSS in the admin Notes feature — reproduced a real onerror payload firing in another viewer's session, then reported and cleaned it up responsibly.",
      "Found that the app's Save/Edit controls fire zero network requests anywhere in the product (Job Information, Products, Post-Install Details, and the Add Job wizard's own Save) — the single highest-impact defect of the engagement.",
      "Ran a live field-inventory technique: harvested each API field's true constraints straight from its Zod validation errors instead of guessing, then built a boundary-value matrix from that ground truth.",
      "Confirmed with read-back + before/after count checks that several UI-only validation gaps (postcode, ABN/ACN, phone format, calendar-invalid dates) have no backend safety net either — the API accepts and stores them verbatim.",
      "Automated the cleanup: 70 test-generated records were replaced with realistic data (real name/business, checksum-valid ABN, valid address, varied product Brand/Model) and the originals permanently removed, verified via record count and content-marker search."
    ],
    codeSnippet: {
      language: "python",
      title: "tests/test_api_security_stage.py — session & injection checks",
      code: `class TestSession:
    def test_logout_revokes_access_token(self, playwright):
        ctx = logged_in(playwright)
        access = cookie(ctx, "access_token")
        assert ctx.post("/api/v1/auth/logout").status in (200, 204)

        replay = with_cookies(playwright, access_token=access)
        assert replay.get(ME).status == 401, "access token still accepted after logout"


class TestErrorHandling:
    @pytest.mark.parametrize("term", ['{"$gt":""}', "'||'1'=='1", "a' OR 1=1--", "$where"])
    def test_search_injection_does_not_widen_results(self, admin, term):
        total = admin.get("/api/v1/jobs?skip=0&limit=1").json()["data"]["total"]
        res = admin.get(f"/api/v1/jobs?skip=0&limit=1&search={quote(term)}")
        assert res.status < 500
        if res.status == 200:
            assert res.json()["data"]["total"] < total  # must not match every record


def test_bad_ids_no_500_no_stack(admin, path):
    # Every malformed/unknown id must fail clean - no stack trace, no 5xx.
    res = admin.get(path)
    assert not STACK_TRACE_PATTERN.search(res.text())
    assert res.status < 500`
    }
  },
  {
    id: "software-co-qa-leadership",
    title: "QA Team Lead — Software.Co",
    subtitle: "End-to-end QA strategy and execution across multiple concurrent web, mobile and client-server product lines",
    category: "leadership",
    featured: true,
    badge: "QA Leadership",
    period: "Apr 2025 – Present",
    summary: "Own the full STLC for several concurrent product lines at Software.Co, Ahmedabad — from test strategy and planning through UAT sign-off and release quality gates — while mentoring engineers on automation and AI-assisted testing.",
    scopeOfWork: [
      "Own end-to-end QA strategy and execution for multiple concurrent product lines across web, mobile and client-server platforms, covering the full Software Testing Life Cycle.",
      "Use Postman for API validation and MySQL/MS SQL Server for backend data checks; manage defects and test cycles in JIRA.",
      "Work with Selenium-based automation, TestNG, Jenkins, Cucumber and Bitbucket as part of the team's CI/CD-aware testing workflow.",
      "Mentor QA engineers on ISTQB best practices and AI-assisted testing; own UAT sign-off, stakeholder communication and release quality gates."
    ],
    metrics: [
      { label: "Role", value: "QA Team Lead" },
      { label: "Since", value: "Apr 2025" },
      { label: "Scope", value: "Multi-Product" },
      { label: "Platforms", value: "Web / Mobile / Client-Server" }
    ],
    tags: ["Selenium WebDriver", "TestNG", "Jenkins", "Postman", "JIRA", "Cucumber", "SQL", "Mentoring"],
    highlights: [
      "Leads QA across several concurrent product lines simultaneously, owning strategy and execution rather than just test writing.",
      "Bridges functional/regression automation with backend data validation, so a passing UI test can't hide a wrong database write.",
      "Mentors QA engineers on ISTQB best practices and on incorporating AI-assisted testing into day-to-day work.",
      "Owns UAT sign-off and stakeholder communication — the last gate before release, not just test execution."
    ]
  },
  {
    id: "healthmate-clinicapp",
    title: "HealthMate / Clinic1 / ClinicApp — Healthcare Web & Mobile",
    subtitle: "Lead QA across a healthcare Web & Mobile product family — functional, regression, API and release testing",
    category: "healthcare",
    featured: false,
    badge: "Healthcare QA",
    period: "Career Highlight",
    summary: "Acted as Lead QA across the HealthMate / Clinic1 / ClinicApp healthcare product family, covering manual, functional and regression testing, API validation with Postman, JIRA defect management, and UAT / release support.",
    scopeOfWork: [
      "Manual, functional and regression test execution across the HealthMate / Clinic1 / ClinicApp Web and Mobile applications.",
      "API request/response validation with Postman as part of integration test coverage.",
      "Defect logging, triage and lifecycle management in JIRA.",
      "UAT coordination and release support ahead of production sign-off."
    ],
    metrics: [
      { label: "Role", value: "Lead QA" },
      { label: "Platforms", value: "Web & Mobile" },
      { label: "API Tooling", value: "Postman" },
      { label: "Defect Tool", value: "JIRA" }
    ],
    tags: ["Manual Testing", "Functional Testing", "Regression Testing", "Postman", "JIRA", "Healthcare", "UAT"],
    highlights: [
      "Led QA end-to-end for a healthcare Web & Mobile product family, not a single isolated module.",
      "Paired manual functional/regression coverage with Postman-driven API validation.",
      "Owned the defect lifecycle in JIRA from discovery through to release sign-off.",
      "Supported UAT directly with stakeholders ahead of production releases."
    ]
  },
  {
    id: "eclinicalworks-registry-crore",
    title: "eClinicalWorks Registry & CRORE — Tier-1 EHR",
    subtitle: "Registry Module Owner on a Tier-1 Electronic Health Record platform, with cross-modality validation",
    category: "healthcare",
    featured: false,
    badge: "Tier-1 EHR",
    period: "Feb 2019 – Apr 2021",
    summary: "Owned Registry testing as Registry Module Owner and tested the CRORE module on eClinicalWorks' Tier-1 EHR platform, performing cross-modality validation across Web, Mobile, iPad and Client-Server environments, and mentoring newer team members.",
    scopeOfWork: [
      "Owned Registry testing as Registry Module Owner on a Tier-1 Electronic Health Record platform.",
      "Tested the CRORE module for functional correctness and regression stability.",
      "Performed cross-modality validation across Web, Mobile, iPad and Client-Server environments.",
      "Mentored new team members, peer-reviewed test cases, and fed enhancement suggestions back to the Project Management team."
    ],
    metrics: [
      { label: "Role", value: "Registry Module Owner" },
      { label: "Platform", value: "Tier-1 EHR" },
      { label: "Modalities", value: "Web / Mobile / iPad / Client-Server" },
      { label: "Tenure", value: "2+ years" }
    ],
    tags: ["EHR", "Healthcare", "Cross-Platform QA", "Functional Testing", "Regression Testing", "Mentoring"],
    highlights: [
      "Owned an entire module (Registry) end-to-end as its named Module Owner on a Tier-1 EHR platform.",
      "Validated the same workflows consistently across four separate modalities — Web, Mobile, iPad and Client-Server.",
      "Peer-reviewed test cases and mentored newer testers joining the team.",
      "Fed QA findings directly into enhancement suggestions for the Project Management team."
    ]
  },
  {
    id: "freeway-blockchain",
    title: "Freeway Blockchain Platform",
    subtitle: "Transaction flow, ledger integrity and data-consistency QA on a distributed-ledger platform",
    category: "blockchain",
    featured: false,
    badge: "Blockchain QA",
    period: "Jun 2021 – Sep 2022",
    summary: "Tested the Freeway blockchain platform, validating transaction flows, ledger integrity, record immutability and data consistency using SQL-based data checks, with cross-browser/cross-device regression via BrowserStack and LambdaTest.",
    scopeOfWork: [
      "Validated transaction flows, ledger integrity, record immutability and data consistency on a distributed-ledger platform.",
      "Used SQL-based data checks to confirm on-chain and off-chain data stayed consistent.",
      "Designed test cases specifically for distributed-ledger edge cases and supported defect resolution.",
      "Used BrowserStack and LambdaTest for cross-browser and cross-device regression testing of the platform's front end."
    ],
    metrics: [
      { label: "Role", value: "QA Engineer" },
      { label: "Domain", value: "Blockchain / DLT" },
      { label: "Data Checks", value: "SQL-Based" },
      { label: "Device Cloud", value: "BrowserStack / LambdaTest" }
    ],
    tags: ["Blockchain", "Distributed Ledger", "SQL", "BrowserStack", "LambdaTest", "Data Integrity"],
    highlights: [
      "Validated ledger integrity and record immutability — correctness guarantees that are core to a blockchain product, not incidental.",
      "Used SQL-based checks to catch data-consistency issues between on-chain state and supporting systems.",
      "Designed test cases specifically targeting distributed-ledger edge cases rather than generic web QA.",
      "Ran cross-browser and cross-device regression via BrowserStack and LambdaTest to cover the platform's full user base."
    ]
  },
  {
    id: "storefront-ecommerce",
    title: "Storefront E-Commerce",
    subtitle: "QA Lead for catalog, cart, checkout and payment workflow testing across browsers",
    category: "ecommerce",
    featured: false,
    badge: "E-Commerce QA",
    period: "Career Highlight",
    summary: "Led functional and regression testing of the Storefront e-commerce platform's core purchase journey — catalog browsing, cart, checkout and payment workflows — across browsers.",
    scopeOfWork: [
      "Functional and regression testing of the product catalog, search and filtering.",
      "Cart and checkout flow validation, including edge cases around pricing, discounts and stock state.",
      "Payment workflow testing across supported browsers.",
      "Cross-browser verification of the end-to-end purchase journey."
    ],
    metrics: [
      { label: "Role", value: "QA Lead" },
      { label: "Focus", value: "Catalog / Cart / Checkout" },
      { label: "Coverage", value: "Payment Workflows" },
      { label: "Testing", value: "Cross-Browser" }
    ],
    tags: ["E-Commerce", "Functional Testing", "Regression Testing", "Payments", "Cross-Browser QA"],
    highlights: [
      "Led QA across the full purchase journey — catalog through payment — rather than one isolated step.",
      "Treated pricing, discount and stock-state edge cases as first-class test scenarios, not afterthoughts.",
      "Verified payment workflows across browsers before release.",
      "Focused regression coverage on the paths that directly affect revenue."
    ]
  },
  {
    id: "spaceo-mobile-apps",
    title: "20+ Mobile & Web Applications — Spaceo Technologies",
    subtitle: "Functional, regression and usability QA across a 20+ app portfolio spanning Android, iOS and Web",
    category: "mobile-apps",
    featured: true,
    badge: "Mobile App QA",
    period: "Feb 2018 – Feb 2019",
    summary: "Tested 20+ client applications across Android, iOS and Web at Spaceo Technologies — functional, regression, UI/UX, compatibility and usability testing, with defect reports clear enough for developers to reproduce and fix without back-and-forth.",
    scopeOfWork: [
      "Functional and cross-browser QA across Android, iOS and Web platforms for 20+ applications.",
      "Testing across Chrome, Firefox, Safari and Edge for consistent desktop behaviour.",
      "Functional, regression, UI/UX, compatibility and usability testing on every release.",
      "Created clear defect reports and worked directly with developers to reproduce and resolve issues."
    ],
    metrics: [
      { label: "Apps Tested", value: "20+" },
      { label: "Platforms", value: "Android / iOS / Web" },
      { label: "Browsers", value: "Chrome / Firefox / Safari / Edge" },
      { label: "Testing Types", value: "Functional / UI-UX / Usability" }
    ],
    tags: ["Mobile QA", "Android", "iOS", "Cross-Browser QA", "Usability Testing", "Compatibility Testing"],
    highlights: [
      "Covered 20+ separate applications, not one product — a breadth of mobile and web QA most single-product roles don't get.",
      "Ran full functional, regression, UI/UX, compatibility and usability passes on every release, not just smoke checks.",
      "Wrote defect reports clear enough that developers could reproduce issues without needing a follow-up call.",
      "Built the cross-platform (Android/iOS/Web) QA instincts that still shape how I scope test coverage today."
    ]
  },
  {
    id: "techuz-web-mobile",
    title: "Enterprise Web & Mobile QA — Techuz InfoWeb",
    subtitle: "Functional, regression and integration testing across complex web and mobile applications, released across four environments",
    category: "mobile-apps",
    featured: false,
    badge: "Web & Mobile QA",
    period: "Nov 2022 – Sep 2023",
    summary: "Designed and executed test plans for complex web and mobile applications as Senior QA Engineer at Techuz InfoWeb, validating releases across Web, Mobile, iPad and Client-Server environments and using AI-assisted workflows to optimise regression suites.",
    scopeOfWork: [
      "Designed and executed test plans for complex web and mobile applications with functional, regression and integration coverage.",
      "Validated releases across Web, Mobile, iPad and Client-Server environments.",
      "Peer-reviewed automation and manual test cases to maintain coverage standards.",
      "Used AI-assisted workflows to optimise regression suites and improve execution efficiency."
    ],
    metrics: [
      { label: "Role", value: "Senior QA Engineer" },
      { label: "Environments", value: "Web / Mobile / iPad / Client-Server" },
      { label: "Coverage", value: "Functional / Regression / Integration" },
      { label: "Efficiency", value: "AI-Assisted Regression" }
    ],
    tags: ["Mobile QA", "Web QA", "Regression Testing", "Integration Testing", "Peer Review", "AI-Assisted Testing"],
    highlights: [
      "Validated the same releases across four distinct environments - Web, Mobile, iPad and Client-Server - not just one.",
      "Peer-reviewed both automation and manual test cases to keep coverage standards consistent across the team.",
      "Was an early adopter of AI-assisted workflows to optimise regression suites well before it became standard practice.",
      "Designed test plans for complex applications, not simple CRUD screens."
    ]
  }
];

export const projectCategories = [
  { id: "all", label: "All Projects" },
  { id: "security-audit", label: "QA & Security Audit" },
  { id: "leadership", label: "QA Leadership" },
  { id: "mobile-apps", label: "Mobile & Web Apps" },
  { id: "healthcare", label: "Healthcare & EHR" },
  { id: "blockchain", label: "Blockchain" },
  { id: "ecommerce", label: "E-Commerce" }
];
