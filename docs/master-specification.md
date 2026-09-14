# WHITEHAT

## Master Product & Technical Specification

**Version:** 0.2
**Status:** Founding Product Blueprint

---

# 1. The Core Idea

Whitehat is an AI-native DeFi security network launching on **Robinhood Chain**.

The platform allows anyone to identify a DeFi protocol they believe is worth investigating.

That user becomes the **Scout** for that target.

Whitehat's specialist AI security agents then investigate the protocol for potential vulnerabilities using automated analysis, fuzzing, economic reasoning, contract simulation and adversarial testing.

If Whitehat discovers a valid vulnerability, it is verified and submitted through the protocol's authorized responsible-disclosure or bug-bounty process.

If a bounty is successfully received:

**50% of the bounty goes to the Scout who originally suggested the target.**

**50% of the bounty is used to buy $WHITEHAT tokens from the open market.**

This creates the core Whitehat economic flywheel:

**More Scouts → More Targets → More Investigations → More Findings → More Bounties → More Scout Rewards + More $WHITEHAT Buybacks**

That flywheel is the heart of the project.

---

# 2. Whitehat in One Sentence

**A decentralized scouting network powered by autonomous security agents, where successful DeFi vulnerability discoveries reward the Scout and drive $WHITEHAT token buybacks.**

---

# 3. Whitehat's Participants

There are five primary participants.

## 3.1 Scouts

Normal users who identify protocols for Whitehat to investigate.

They do NOT need:

* coding skills
* security experience
* auditing experience

Their value is discovering interesting targets.

If their target eventually generates a successful bounty, they receive 50% of that bounty.

---

## 3.2 Whitehat Agents

Specialist AI agents responsible for security research.

Different agents perform different jobs rather than relying on one general AI model.

Examples:

* protocol discovery
* contract mapping
* code analysis
* fuzz testing
* invariant analysis
* economic attack analysis
* vulnerability simulation
* adversarial review
* reporting

---

## 3.3 Human Security Reviewers

Potential significant findings must pass human validation before being disclosed.

AI discovers and investigates.

Humans approve sensitive real-world actions.

---

## 3.4 Protocols

DeFi projects whose smart contracts Whitehat investigates.

Where appropriate, findings are handled through:

* official bug bounty programs
* direct security contact
* authorized responsible disclosure

---

## 3.5 $WHITEHAT Holders

$WHITEHAT represents the economic layer surrounding the Whitehat network.

Successful bounty activity creates market demand for the token through protocol-funded buybacks.

Holding $WHITEHAT is not required to submit a target.

The scouting network should remain accessible.

---

# 4. The Whitehat Flywheel

The core product loop is:

```text
                        SCOUT
                          │
                          ▼
                   SUGGESTS TARGET
                          │
                          ▼
                  WHITEHAT REGISTRY
                          │
                          ▼
                    AGENTS ANALYSE
                          │
                          ▼
                 VULNERABILITY FOUND?
                     │          │
                    NO         YES
                     │          │
                  ARCHIVE       ▼
                        HUMAN VALIDATION
                               │
                               ▼
                    RESPONSIBLE DISCLOSURE
                               │
                               ▼
                       BOUNTY RECEIVED
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
               50% TO SCOUT        50% BUYBACK
                                          │
                                          ▼
                                      $WHITEHAT
```

The system connects useful human discovery with machine-scale analysis.

---

# 5. Why Scouts Matter

Whitehat should not attempt to determine every interesting target itself.

Thousands of users can provide distributed intelligence.

Someone may notice:

* a rapidly growing protocol
* a new launch
* an unusual contract
* a major upgrade
* a protocol with an active bounty
* a system that has received little security attention

They submit it to Whitehat.

Whitehat then performs the technical research.

This means someone can contribute meaningful value to security without being able to write Solidity.

---

# 6. Target Attribution

The target-attribution system is critical because potentially significant amounts of money may depend on it.

Whitehat must establish:

> Who discovered this target for Whitehat first?

Each eligible submission receives:

* Scout wallet address
* target identifier
* chain
* contract/protocol
* timestamp
* unique submission ID

Example:

```text
TARGET #1842

Protocol
Alpha Finance

Chain
Robinhood Chain

Primary Contract
0x8327...91FA

Scout
0x72FA...22C1

Submitted
14 September 2026

Finder Share
50%

Status
INVESTIGATING
```

---

# 7. First-Scout Rule

The first valid eligible submission owns the Scout attribution for that target.

Later duplicate submissions do not replace the original Scout.

The system must detect duplicates.

Potential edge cases include:

* same contract submitted twice
* proxy and implementation submitted separately
* same protocol with several contracts
* upgraded protocol
* new protocol version
* previously investigated target
* Whitehat already investigating a target internally

These situations require documented attribution rules.

---

# 8. Onchain Attribution

Initially Whitehat may use its database while development is underway.

The full product includes a **Target Registry smart contract on Robinhood Chain**.

Its purpose is to provide transparent timestamped evidence of submissions.

The registry should store minimal information such as:

* target hash
* Scout wallet
* timestamp
* target ID

Sensitive investigation data should never be stored publicly onchain.

---

# 9. Target Submission Experience

A user connects their wallet and sees:

```text
WHITEHAT

FIND THE NEXT TARGET

Suggest a protocol for Whitehat agents to investigate.

Protocol
[________________________]

Contract
[________________________]

Chain
[ Robinhood Chain       ▼ ]

Bounty Program
[________________________]

Why should we investigate it?
[________________________]


        SUBMIT TARGET
```

After submission:

```text
TARGET #1842 CREATED

Scout
0x72FA...22C1

Finder Allocation
50%

Status
QUEUED
```

---

# 10. Target Eligibility

Before intensive security work begins, Whitehat determines what type of research is permitted.

Possible classifications:

## AUTHORIZED_BOUNTY

The target has an active bounty program and the relevant contracts/actions are in scope.

## PROTOCOL_AUTHORIZED

The protocol has directly authorized Whitehat research.

## PUBLIC_RESEARCH

Whitehat can perform non-invasive public-code and isolated simulation analysis.

## OUT_OF_SCOPE

The target cannot currently be investigated using the proposed methodology.

This protects the project and provides rules to the agents.

---

# 11. Investigation Pipeline

An investigation moves through visible stages.

```text
QUEUED

↓

RECON

↓

SYSTEM MAPPING

↓

STATIC ANALYSIS

↓

INVARIANT GENERATION

↓

FUZZING

↓

ECONOMIC ANALYSIS

↓

SIMULATION

↓

CRITIC REVIEW

↓

HUMAN REVIEW

↓

DISCLOSURE

↓

RESOLUTION
```

Users should be able to follow progress without accessing sensitive unresolved vulnerability information.

---

# 12. Whitehat Agent Network

## Agent 01 — Scout Agent

Builds a technical profile of the target.

Identifies:

* contracts
* source code
* proxies
* compiler information
* dependencies
* relevant documentation
* related protocol components

---

## Agent 02 — Cartographer Agent

Builds a map of how the protocol works.

Looks at:

* contract relationships
* permissions
* upgrade systems
* money flows
* external calls
* oracle dependencies
* ownership structure

---

## Agent 03 — Static Security Agent

Examines source code and deterministic scanner results.

Looks for suspicious patterns involving:

* access control
* reentrancy
* state management
* external calls
* initialization
* accounting
* upgrades
* permissions

---

## Agent 04 — Invariant Agent

Determines rules that should never be breakable.

Example:

```text
A user should never be able to withdraw
more assets than their legitimate balance permits.
```

These rules become automated tests.

---

## Agent 05 — Fuzz Agent

Runs large numbers of unusual inputs and transaction sequences.

Example:

Instead of testing:

```text
Deposit 100
Withdraw 100
```

it may automatically investigate thousands of combinations involving:

* tiny values
* enormous values
* unusual ordering
* repeated operations
* multiple accounts
* unexpected state transitions

---

## Agent 06 — Economic Agent

Looks beyond simple programming mistakes.

It investigates:

* oracle manipulation
* liquidity assumptions
* collateral calculations
* liquidation logic
* token accounting
* share inflation
* rounding
* pricing
* incentive design

These are particularly important in DeFi.

---

## Agent 07 — Simulation Agent

Attempts to prove suspected vulnerabilities inside an isolated blockchain environment.

It may use:

* local EVM
* forked blockchain state
* testnet
* authorized testing environment

This produces evidence without attacking the live protocol.

---

## Agent 08 — Critic Agent

The Critic tries to prove findings are wrong.

It asks:

* Is the supposed vulnerability genuinely reachable?
* Did another agent misunderstand the code?
* Does access control prevent it?
* Is the economic assumption realistic?
* Is this intended behavior?
* Can the finding actually be reproduced?

This is essential for reducing false positives.

---

## Agent 09 — Report Agent

Converts validated research into a professional report.

Contains:

* finding
* severity
* impact
* evidence
* reproduction
* affected components
* suggested mitigation
* confidence
* disclosure information

---

# 13. Finding Lifecycle

A finding progresses through:

```text
CANDIDATE

↓

TESTING

↓

CRITIC REVIEW

↓

VALIDATED

↓

HUMAN REVIEW

↓

DISCLOSURE READY

↓

DISCLOSED

↓

ACCEPTED / REJECTED

↓

RESOLVED
```

A candidate AI finding must never automatically become a public disclosure.

---

# 14. Bounty Lifecycle

Once a finding has passed review:

```text
VALIDATED FINDING

↓

BOUNTY SCOPE CONFIRMED

↓

RESPONSIBLE DISCLOSURE

↓

PROTOCOL REVIEW

↓

FINDING ACCEPTED

↓

BOUNTY AGREED

↓

BOUNTY RECEIVED

↓

50 / 50 DISTRIBUTION
```

Whitehat must maintain records linking:

**Target → Scout → Investigation → Finding → Disclosure → Bounty**

---

# 15. The 50 / 50 Rule

The defining economic rule of Whitehat is:

# 50% → Scout

# 50% → $WHITEHAT Buyback

Example:

A Scout submits Protocol X.

Whitehat discovers a vulnerability.

The protocol awards:

**$200,000**

Distribution:

```text
Scout                    $100,000

$WHITEHAT Buyback        $100,000
```

The Scout gets paid because they surfaced the opportunity.

$WHITEHAT holders benefit from protocol-driven market demand created by Whitehat's successful security work.

---

# 16. Whitehat Should Not Quietly Dilute the 50/50 Split

Whitehat itself should not advertise a 50/50 model and then remove hidden operating fees.

The product principle should be:

**50% of the bounty amount actually received by Whitehat is attributed to the Scout.**

**50% is allocated to the buyback.**

Any unavoidable third-party bounty-platform deductions should be transparently shown before the split.

Whitehat's operating expenses should be funded separately.

---

# 17. Scout Payment

Scout rewards should preferably be paid in the asset received from the bounty.

Examples:

If bounty paid in USDC:

```text
50% USDC → Scout
```

If paid in ETH:

```text
50% ETH → Scout
```

The Scout should not be forced to accept $WHITEHAT instead.

This makes the incentive straightforward.

---

# 18. $WHITEHAT Buyback

The remaining bounty share enters the Whitehat buyback system.

Example:

```text
$100,000 USDC
       │
       ▼
BUYBACK EXECUTOR
       │
       ▼
APPROVED ROBINHOOD CHAIN DEX
       │
       ▼
PURCHASE $WHITEHAT
       │
       ▼
WHITEHAT BUYBACK VAULT
```

Every completed buyback should be publicly verifiable.

---

# 19. Buyback Vault

Purchased $WHITEHAT initially enters a transparent **Buyback Vault**.

This is better than immediately making an irreversible decision about burning versus reusing tokens.

The dashboard can display:

```text
TOTAL BOUNTIES RECEIVED     $2,840,000

PAID TO SCOUTS              $1,420,000

ALLOCATED TO BUYBACKS       $1,420,000

$WHITEHAT PURCHASED         84,321,904

BUYBACK TRANSACTIONS        31
```

The eventual treatment of purchased tokens can be governed by the published token policy.

Possible future policies include:

* permanently locking tokens
* burning tokens
* protocol-owned reserves
* security ecosystem incentives

This decision should be explicit rather than hidden.

---

# 20. $WHITEHAT Token

Ticker:

# $WHITEHAT

Network:

# Robinhood Chain

Token standard:

**ERC-20**

The token represents the economic network surrounding Whitehat security activity.

Its primary mechanism is not artificial staking yield.

Its central economic mechanism is:

> Real Whitehat bounty revenue creates $WHITEHAT buyback demand.

---

# 21. Token Design Principles

$WHITEHAT should be:

* simple
* transparent
* fixed-supply
* easy to understand
* publicly auditable

It should avoid unnecessarily complicated tokenomics.

No rebasing.

No hidden transfer tax.

No obscure emissions system.

No forced token requirement for basic Scout participation.

---

# 22. Proposed Supply

Recommended modelling assumption:

# 1,000,000,000 $WHITEHAT

One billion fixed tokens.

This number is provisional until we design the complete launch and distribution model.

The smart contract should have:

**no ability to secretly mint additional supply after final issuance.**

---

# 23. Token Utility

The primary utility/economic role is the **bounty buyback mechanism**.

Potential additional utility can eventually include:

## Research Prioritization

$WHITEHAT holders may signal which eligible targets should receive additional research resources.

## Scout Reputation

Token-based mechanisms could potentially help discourage spam submissions.

This should never create a system where wealthy users can steal another Scout's attribution.

## Governance

Certain protocol parameters may eventually be governed by the community.

Examples:

* Buyback Vault policy
* supported chains
* ecosystem grants

Critical security decisions should not simply be decided by token vote.

## Ecosystem Incentives

A portion of ecosystem tokens may support:

* security researchers
* integrations
* competitions
* developer grants

None of these should obscure the core bounty-buyback model.

---

# 24. Token Distribution

The exact launch allocation should be finalized as a separate tokenomics exercise.

It must clearly specify:

* community allocation
* liquidity
* team allocation
* treasury
* ecosystem incentives
* vesting
* lockups

Team tokens should have transparent vesting.

Treasury wallets should be publicly identified.

Large allocations should never be disguised across multiple wallets.

---

# 25. Token Launch

The project launches $WHITEHAT on Robinhood Chain.

Token launch should happen alongside a functioning Whitehat product rather than existing only as a promise.

At minimum before public token launch Whitehat should demonstrate:

* working target submissions
* functioning agent investigations
* public investigation interface
* Scout attribution
* end-to-end demo
* transparent contracts

The token is nevertheless part of the product architecture from the beginning.

---

# 26. Whitehat Smart Contracts

The full system is expected to contain several contracts.

## WhitehatToken

ERC-20 implementation of $WHITEHAT.

Responsibilities:

* supply issuance
* transfers

It should remain intentionally simple.

---

## TargetRegistry

Records target attribution.

Responsibilities:

* register target hash
* record Scout
* timestamp submission
* prevent attribution replacement

---

## BountyDistributor

Handles verified bounty distributions.

Conceptually:

```text
Bounty received
      │
      ├── 50% Scout
      │
      └── 50% Buyback allocation
```

Bounty distributions should require authorized human approval rather than being triggered by AI.

---

## BuybackExecutor

Receives buyback allocation and executes trades through approved Robinhood Chain liquidity venues.

It should have:

* slippage protection
* approved router list
* transaction limits
* emergency pause
* audit logs

---

## BuybackVault

Receives $WHITEHAT bought by the protocol.

Publicly visible balances and transactions.

---

## Treasury

Funds Whitehat development and operations separately from the 50/50 bounty mechanism.

---

# 27. Contract Security

Because Whitehat itself will be a security project, its smart contracts will receive enormous scrutiny.

Contracts must therefore be:

* minimal
* thoroughly tested
* audited before significant value flows through them
* protected by multisig controls
* protected by timelocks where appropriate
* publicly verified

No single AI agent should possess unrestricted control over treasury contracts.

---

# 28. Whitehat Website

The complete application includes:

## HOME

Explains Whitehat and shows live network statistics.

## SUBMIT

Submit new targets.

## INVESTIGATIONS

View investigations.

## TARGET

Individual investigation page.

## SCOUTS

Scout leaderboard and profiles.

## BOUNTIES

Completed successful bounty outcomes.

## BUYBACKS

Transparent $WHITEHAT buyback history.

## TOKEN

$WHITEHAT supply, addresses, distribution and token information.

## AGENTS

Explains the Whitehat security-agent architecture.

## PROTOCOLS

Information for protocol teams.

## ADMIN / REVIEW

Private operating interface.

---

# 29. Whitehat Homepage

The eventual homepage might read:

```text
WHITEHAT

AUTONOMOUS DEFI SECURITY

Discover targets.
Deploy intelligence.
Defend DeFi.

[ SUBMIT A TARGET ]     [ EXPLORE ]


$18.4B
VALUE ANALYSED

2,841
CONTRACTS INVESTIGATED

37
VALID FINDINGS

$2.7M
BOUNTIES EARNED


THE WHITEHAT NETWORK

Anyone can find the target.

Our agents do the research.

Successful bounty?

50% Scout
50% $WHITEHAT Buyback
```

This communicates the complete project immediately.

---

# 30. Investigation UI

Example:

```text
INVESTIGATION #0042

NOVA FINANCE

0x8217...823A

Submitted by
0x7712...891E

Scout Share
50%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ RECON

✓ SYSTEM MAPPING

✓ STATIC ANALYSIS

✓ INVARIANT GENERATION

● FUZZING

○ ECONOMIC ANALYSIS

○ SIMULATION

○ CRITIC REVIEW

○ REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Contracts mapped          18
Static checks             146
Fuzz executions       182,441
Candidate findings         4
Validated findings         -
```

---

# 31. Scout Profile

Example:

```text
SCOUT

0x821...71A

━━━━━━━━━━━━━━━━━━━━

TARGETS SUBMITTED       31

INVESTIGATIONS          24

VALID FINDINGS           6

BOUNTIES EARNED    $286,000

SCOUT REWARDS      $143,000
```

This introduces a competitive discovery layer.

---

# 32. Leaderboard

```text
WHITEHAT SCOUTS

                       TARGETS     BOUNTIES

0x82...12                  31       $143,000

0x19...AF                  18        $81,000

0x71...44                  14        $47,500
```

This can make finding promising protocols part of the product itself.

---

# 33. Buyback Dashboard

One of Whitehat's most important public pages.

Example:

```text
$WHITEHAT BUYBACKS

TOTAL BOUNTY VALUE

$2,700,000

SCOUT DISTRIBUTIONS

$1,350,000

BUYBACK CAPITAL

$1,350,000


RECENT BUYBACKS

$42,500     TX 0x72...
$18,000     TX 0x92...
$71,250     TX 0x31...
```

Every transaction should be linked to onchain evidence.

---

# 34. High-Level Technical Architecture

```text
                            WHITEHAT
                                │
               ┌────────────────┴────────────────┐
               │                                 │
            WEBSITE                           ONCHAIN
               │                                 │
         CONNECT WALLET                   $WHITEHAT TOKEN
               │                                 │
         SUBMIT TARGET                    TARGET REGISTRY
               │                                 │
               └────────────┬────────────────────┘
                            ▼
                     TARGET DATABASE
                            │
                            ▼
                   ELIGIBILITY ENGINE
                            │
                            ▼
                  AGENT ORCHESTRATOR
                            │
           ┌────────────────┼────────────────┐
           │                │                │
        SCOUT           SECURITY         ECONOMIC
        AGENTS            AGENTS           AGENT
           │                │                │
           └────────────────┼────────────────┘
                            ▼
                     SECURITY TOOLS
                            │
            ┌───────────────┼──────────────┐
            │               │              │
         SLITHER         FOUNDRY        SIMULATION
                            │
                            ▼
                      CRITIC AGENT
                            │
                            ▼
                       HUMAN REVIEW
                            │
                            ▼
                RESPONSIBLE DISCLOSURE
                            │
                            ▼
                       BOUNTY PAID
                            │
                  BOUNTY DISTRIBUTOR
                            │
              ┌─────────────┴──────────────┐
              │                            │
            50%                           50%
              │                            │
           SCOUT                    BUYBACK EXECUTOR
                                           │
                                           ▼
                                     BUY $WHITEHAT
                                           │
                                           ▼
                                      BUYBACK VAULT
```

---

# 35. Technology Stack

## Website

Next.js

TypeScript

Tailwind CSS

## Wallet / Blockchain

wagmi

viem

## Network

Robinhood Chain

Robinhood Chain Testnet for development

## Smart Contracts

Solidity

Foundry

OpenZeppelin where appropriate

## Database

PostgreSQL

Supabase during early development

## Security Workers

Python

Docker

## Analysis

Foundry

Slither

custom analyzers

fuzz testing

invariant testing

fork simulation

AI security agents

## Infrastructure

GitHub

Vercel

managed worker infrastructure

managed database

---

# 36. Data Model

Core entities:

## Scout

Wallet identity.

## Target

Protocol/contract being investigated.

## Submission

Relationship between Scout and Target.

## Investigation

Research process.

## AgentRun

Record of an individual agent's work.

## Finding

Potential or validated security issue.

## Disclosure

Record of responsible disclosure.

## Bounty

Accepted financial reward.

## Distribution

Scout and buyback allocation.

## Buyback

Onchain purchase record.

## TokenTransaction

Relevant $WHITEHAT system transactions.

---

# 37. Important Relationships

The database must always be capable of answering:

```text
Who submitted this target?

↓

Which investigation resulted?

↓

Which finding was accepted?

↓

What bounty resulted?

↓

How much did the Scout receive?

↓

How much was allocated to the buyback?

↓

Which onchain transaction performed the buyback?
```

That lineage is central to Whitehat's credibility.

---

# 38. Security Boundaries

Whitehat agents may:

* read public contracts
* inspect source
* compile code
* create tests
* fuzz locally
* create blockchain forks
* simulate vulnerabilities
* reason about economic attacks
* create disclosure reports

Agents may NOT autonomously:

* exploit live targets
* transfer target assets
* broadcast unauthorized attacks
* disclose unresolved critical vulnerabilities publicly
* control treasury private keys
* approve bounty distributions

Sensitive actions require human authorization.

---

# 39. Revenue and Sustainability

The defining bounty mechanism remains:

**50% Scout / 50% Buyback**

Therefore Whitehat should not rely on taking an additional hidden percentage from that pool.

Possible business models outside that mechanism can eventually include:

* security subscriptions for protocols
* private continuous monitoring
* premium protocol analysis
* enterprise security services
* API access
* integrations

These can fund operations while preserving the Scout promise.

---

# 40. Full Product Roadmap

The scope contains the whole system from the beginning, but development is sequenced to make it achievable.

## Stage 0 — Foundation

* full specification
* brand
* architecture
* GitHub repository
* development environment

## Stage 1 — Whitehat Interface

* homepage
* wallet connection
* Submit Target
* investigations UI
* Scout identity

## Stage 2 — Security Engine

* contract discovery
* static analysis
* Foundry
* fuzzing
* local simulations
* security agents
* Critic Agent

## Stage 3 — Scout Network

* Target Registry
* first-Scout attribution
* profiles
* leaderboard
* duplicate rules

## Stage 4 — Disclosure System

* bounty scope
* human-review interface
* reports
* disclosure workflow
* protocol communication

## Stage 5 — $WHITEHAT

* token contract
* supply
* token distribution
* liquidity
* Token page
* Robinhood Chain deployment

## Stage 6 — Bounty Economy

* bounty tracking
* BountyDistributor
* Scout payments
* BuybackExecutor
* BuybackVault
* public buyback dashboard

## Stage 7 — Public Network

* external Scouts
* live investigations
* security partnerships
* supported bounty programs
* protocol onboarding

## Stage 8 — Expansion

* additional EVM chains
* additional agents
* continuous monitoring
* protocol subscriptions
* security API
* advanced Scout reputation

---

# 41. What "MVP" Means for Whitehat

MVP no longer means:

> Whitehat without the token concept.

Instead it means:

> The smallest working version of the complete Whitehat system.

Every part we build should lead toward:

**Scout → Target → Agents → Finding → Bounty → 50% Scout / 50% $WHITEHAT Buyback**

Some components are mocked or manual initially, but the architecture must anticipate the entire loop.

---

# 42. North-Star Metrics

Whitehat should eventually track:

## Security

Total protocols investigated

Total contracts analysed

Total value secured/analyzed

Validated vulnerabilities

Critical vulnerabilities

## Network

Unique Scouts

Targets submitted

Active investigations

Repeat Scouts

## Bounty Economy

Total bounty value

Total Scout rewards

Total buyback capital

Total $WHITEHAT purchased

Number of successful bounties

## Quality

False-positive rate

Validation rate

Average investigation time

Bounty acceptance rate

---

# 43. The Whitehat Promise

For Scouts:

> **Find the target. If Whitehat turns it into a successful bounty, you receive half.**

For token holders:

> **Successful Whitehat bounty activity directs the other half toward $WHITEHAT buybacks.**

For protocols:

> **Whitehat combines automated security research with controlled testing and responsible disclosure.**

---

# 44. The Product Thesis

Traditional bug bounty hunting depends upon a relatively small number of technically sophisticated people both:

1. finding interesting protocols, and
2. finding vulnerabilities inside them.

Whitehat separates those jobs.

Millions of people can potentially become Scouts.

AI security agents perform the expensive technical investigation.

Expert humans validate serious findings.

Protocols receive responsible disclosures.

Successful discoveries reward Scouts.

And half of Whitehat's bounty success flows back into the $WHITEHAT economy.

That is Whitehat.
