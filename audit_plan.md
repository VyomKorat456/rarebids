# Auction System Audit & Code Quality Task List

- [ ] Identity & Access Management (IAM) Audit
    - [ ] Review `JwtService` and `SecurityConfig` in `auth-service`
    - [ ] Review `SecurityConfig` and Role annotations in `auction-service`
    - [ ] Check for IDOR in auction updates/deletions
- [ ] Concurrency & Transaction Integrity Review
    - [ ] Analyze `BidService` for race conditions
    - [ ] Verify Redis vs. Database consistency in `AuctionService`
- [ ] Data Security & Validation
    - [ ] Audit `AuctionController` image retrieval for Path Traversal vulnerabilities
    - [ ] Check input validation in auction creation and bidding
- [ ] Error Handling & Resilience
    - [ ] Review exception handling in Feign clients (`AuthServiceClient`)
    - [ ] Audit verbose error messages in global exception handlers
- [ ] Code Quality & Structure
    - [ ] Identify redundant code or hardcoded values
    - [ ] Review Frontend API service logic for security (token handling)
