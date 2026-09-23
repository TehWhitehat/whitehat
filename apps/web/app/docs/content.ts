export type DocSection = { title: string; text?: string[]; steps?: string[]; rows?: string[][]; links?: string[][]; pipeline?: boolean };
export type DocPage = { slug: string; title: string; description: string; group: string; sections: DocSection[] };
export const docPages: DocPage[] = [
  {
    "slug": "",
    "title": "Welcome to WHITEHAT",
    "description": "A coordinated investigation system: nine specialist security agents map, analyse, test, challenge and synthesise evidence.",
    "group": "Start here",
    "sections": [
      {
        "title": "The tools provide evidence. The agents investigate what that evidence means.",
        "text": [
          "WHITEHAT is a defensive DeFi security intelligence network built around nine specialised investigation roles. Scouts surface targets. The investigation engine establishes chain context, analyses source and tool evidence, develops hypotheses, tests where safe, challenges conclusions and assembles a report for human review.",
          "Five stages use model reasoning: Static Analyst, Invariant Agent, Economic Agent, Critic and Reporter. The wider nine-agent architecture also includes deterministic reconnaissance, protocol mapping and controlled testing. These are complementary roles in one coordinated investigation, not nine unrestricted autonomous models."
        ]
      },
      {
        "title": "The WHITEHAT agent network",
        "text": [
          "An investigation is not a single general-purpose prompt asking whether a contract is vulnerable. Each role receives bounded evidence appropriate to its task. Later review stages can challenge and synthesise earlier conclusions, while deterministic observations remain authoritative."
        ],
        "pipeline": true
      },
      {
        "title": "Why specialised perspectives matter",
        "text": [
          "Smart-contract security is not one problem. Valid syntax can coexist with incorrect permissions, broken accounting, unsafe external interactions, edge-case state transitions or upgrade mistakes. Economic assumptions and combinations of otherwise valid behaviours can matter as much as an isolated code pattern.",
          "WHITEHAT therefore organises investigation around distinct perspectives. This sequence structures the research; it does not imply complete coverage of every protocol or vulnerability class."
        ],
        "steps": [
          "Map",
          "Analyse",
          "Form hypotheses",
          "Test where safe",
          "Challenge conclusions",
          "Synthesise evidence"
        ],
        "links": [
          [
            "Explore all nine agents",
            "agents"
          ],
          [
            "How tools and agents work together",
            "security-stack"
          ]
        ]
      },
      {
        "title": "From discovery to responsible action",
        "steps": [
          "Scout discovers target",
          "Target submitted",
          "Recon and mapping",
          "Scope-approved security analysis",
          "Human review",
          "Responsible disclosure",
          "Eligible bounty received",
          "50% Scout / 50% WHITEHAT buyback"
        ],
        "text": [
          "Submissions, investigation progress and private review are implemented. Findings remain candidates until reviewed. Disclosure and bounty outcomes require human action; the production economic loop remains pending, with existing contract demonstrations clearly labelled TESTNET."
        ],
        "links": [
          [
            "How it works",
            "how-it-works"
          ],
          [
            "Understanding results",
            "results"
          ],
          [
            "Public beta and limitations",
            "beta"
          ]
        ]
      }
    ]
  },
  {
    "slug": "how-it-works",
    "title": "How WHITEHAT works",
    "description": "Follow a target from wallet-attributed submission through scoped analysis, private review and responsible disclosure.",
    "group": "Start here",
    "sections": [
      {
        "title": "1. Submit a target",
        "text": [
          "A Scout connects a supported EVM wallet and signs an offchain identity message. This sign-in is not a transaction, fund transfer or token approval. The target form accepts a supported network and an EVM contract address, plus optional protocol details, security-program link and notes.",
          "Supabase saves the submission and its investigation. A repeated target on the same chain retains the original Scout. Submissions are not a grant of permission to attack the target."
        ]
      },
      {
        "title": "2. Establish what is onchain",
        "text": [
          "New targets queue read-only Recon. Recon checks the network and reads bytecode and limited proxy metadata, then retrieves supported explorer metadata and ABI information. No target transaction is sent.",
          "An address with no code, unavailable upstream data or unsupported source can limit what follows. A populated investigation page is not proof that every analysis stage ran."
        ]
      },
      {
        "title": "3. Review scope before deeper analysis",
        "text": [
          "An approved operator reviews eligibility, allowed and excluded addresses, restrictions and permission for offline analysis. Saving scope does not silently launch deeper work: the operator queues it explicitly.",
          "Supported verified source can be compiled and statically analysed. The current beta does not automatically generate and execute arbitrary third-party fuzz harnesses. Controlled execution is limited to the repository-owned fixture."
        ]
      },
      {
        "title": "4. Review and disclose responsibly",
        "text": [
          "The Critic and Reporter organise evidence, but a human must determine whether a candidate is valid. Private disclosure drafts can be prepared after human validation. The system does not automatically send them or exploit a protocol.",
          "Any bounty depends on the protocol's rules, eligibility and actual acceptance/payment. Production Scout allocation and buybacks are intended economics, not an automatic result of a completed investigation."
        ],
        "links": [
          [
            "Scout attribution",
            "scouts"
          ],
          [
            "Safety and disclosure",
            "security"
          ],
          [
            "Results and review",
            "results"
          ]
        ]
      }
    ]
  },
  {
    "slug": "agents",
    "title": "The nine agents",
    "description": "Nine specialist perspectives coordinate evidence gathering, reasoning, controlled testing, adversarial challenge and reporting.",
    "group": "Analysis",
    "sections": [
      {
        "title": "01 Recon Agent",
        "text": [
          "Establish reliable ground truth"
        ],
        "rows": [
          [
            "Consumes",
            "The selected network, submitted address, chain responses and explorer metadata."
          ],
          [
            "Investigates",
            "Confirms network context and deployed bytecode, checks supported proxy/implementation relationships and establishes source availability, compiler identity and verified ABI availability before deeper reasoning begins."
          ],
          [
            "Produces",
            "A recorded target snapshot with code size, source/ABI metadata and bounded proxy observations. Recon provides facts for analysis; it does not send target transactions."
          ]
        ]
      },
      {
        "title": "02 Cartographer",
        "text": [
          "Build the structural starting point"
        ],
        "rows": [
          [
            "Consumes",
            "Recon observations, verified ABI entries and metadata for the submitted contract and a resolved implementation where available."
          ],
          [
            "Investigates",
            "Organises contract identity, callable function/event surfaces and supported upgrade relationships so later roles know which components the evidence describes."
          ],
          [
            "Produces",
            "A first-pass contract/ABI map. Privileged roles, token/value flows and external dependencies require deeper source evidence; this stage does not yet construct an exhaustive relationship or economic-flow graph."
          ]
        ]
      },
      {
        "title": "03 Static Analyst",
        "text": [
          "Interpret source and static evidence"
        ],
        "rows": [
          [
            "Consumes",
            "Supported verified source, compilation results and Slither detector findings."
          ],
          [
            "Investigates",
            "Uses source context to examine reported unsafe patterns, access-control concerns, external interactions and accounting/state behaviour where evidence supports them. Slither provides deterministic observations; model reasoning contextualises their significance instead of replacing the tool."
          ],
          [
            "Produces",
            "Evidence-linked candidate findings and concise analysis of affected components. Detector severity and model confidence remain distinct from demonstrated impact."
          ]
        ]
      },
      {
        "title": "04 Invariant Agent",
        "text": [
          "Reason about what must remain true"
        ],
        "rows": [
          [
            "Consumes",
            "Source/ABI-grounded templates and bounded analysis evidence."
          ],
          [
            "Investigates",
            "Develops candidate properties such as conservation of accounting units and consistency across operations. Permission or state-transition assumptions may inform a candidate when supported by source; they are not claimed as universally implemented checks."
          ],
          [
            "Produces",
            "Candidate invariants, supporting rationale and assumptions. A proposed property can inform a supported test, but suggesting it does not create or execute a safe harness."
          ]
        ]
      },
      {
        "title": "05 Fuzz Agent",
        "text": [
          "Challenge properties with varied inputs"
        ],
        "rows": [
          [
            "Consumes",
            "A supported Foundry build and controlled test harness."
          ],
          [
            "Investigates",
            "Explores input sequences and state changes capable of violating the properties encoded in the harness, rather than equating successful compilation with correctness."
          ],
          [
            "Produces",
            "Test results, failure observations and fuzz/invariant execution counts. Execution is presently supported for the repository-owned fixture; real targets without a safe supported harness remain LIMITED. This is not live-contract fuzzing."
          ]
        ]
      },
      {
        "title": "06 Economic Agent",
        "text": [
          "Connect code-level signals to economic hypotheses"
        ],
        "rows": [
          [
            "Consumes",
            "Actual findings, invariant candidates and their evidence references."
          ],
          [
            "Investigates",
            "DeFi failures can be economic even when code compiles. This role examines supported accounting/conservation concerns and authorization paths that could affect privileged accounting. It asks what additional assets, redemption paths or caller conditions would be needed before a code-level defect implies loss."
          ],
          [
            "Produces",
            "Evidence-grounded economic hypotheses with assumptions and confidence. A mismatch in accounting units does not itself demonstrate extractable value. Pricing, liquidity, incentives and exchange-rate modelling are not claimed as general implemented capabilities."
          ]
        ]
      },
      {
        "title": "07 Simulation Agent",
        "text": [
          "Separate a plausible scenario from reproduced behaviour"
        ],
        "rows": [
          [
            "Consumes",
            "Candidates and a supported controlled reproduction harness."
          ],
          [
            "Investigates",
            "Checks whether expected and observed behaviour agree in an isolated test. Reasoning that a failure may exist and independently reproducing that failure are different evidence levels."
          ],
          [
            "Produces",
            "Reproduction outcomes linked to candidates. Independent fixture reruns are supported; arbitrary third-party deployment, fork simulation and real-target execution are not automatically available."
          ]
        ]
      },
      {
        "title": "08 Critic",
        "text": [
          "Challenge the investigation itself"
        ],
        "rows": [
          [
            "Consumes",
            "Candidate findings, invariants, economic hypotheses, simulation results and available earlier AI conclusions."
          ],
          [
            "Investigates",
            "Acts as an adversarial review layer: questions reachability, access control, intended behaviour, weak assumptions, duplicates, missing context and conclusions stronger than the evidence. Its model instructions explicitly reject earlier AI opinions that contradict deterministic evidence."
          ],
          [
            "Produces",
            "Challenges, rejection or requests for more evidence, and evidence-supported review outcomes. It is designed to resist simple reinforcement of earlier conclusions, not to produce another unexamined vulnerability list. Human validation remains separate."
          ]
        ]
      },
      {
        "title": "09 Reporter",
        "text": [
          "Turn evidence into a coherent investigation"
        ],
        "rows": [
          [
            "Consumes",
            "Deterministic findings and test outcomes, available agent conclusions, limitations and Critic review."
          ],
          [
            "Investigates",
            "Synthesises the investigation while keeping tool observations, hypotheses, reproduction status, severity, confidence and unresolved questions distinguishable."
          ],
          [
            "Produces",
            "A bounded structured private report with supporting evidence, remediation and items requiring human validation, plus an allowlisted public summary. Including an uncertain hypothesis in the final report never makes it a confirmed vulnerability."
          ]
        ]
      }
    ]
  },
  {
    "slug": "security-stack",
    "title": "Security stack",
    "description": "Two complementary layers: deterministic security evidence and specialised agent reasoning.",
    "group": "Analysis",
    "sections": [
      {
        "title": "The tools provide evidence. The agents investigate what that evidence means.",
        "text": [
          "WHITEHAT combines deterministic observation with specialised reasoning. Tools establish what was read, compiled, detected or tested. Agents interpret those observations, expose assumptions and connect evidence into a coherent investigation.",
          "Neither layer is a substitute for the other. A detector signal needs context; an agent hypothesis needs evidence. Human review decides whether a supported candidate should be treated as a confirmed vulnerability."
        ]
      },
      {
        "title": "Deterministic evidence layer",
        "rows": [
          [
            "Chain and explorer data",
            "Network identity, deployed bytecode, source availability and compiler metadata"
          ],
          [
            "Proxy and ABI observations",
            "Supported implementation relationships and callable function/event surfaces"
          ],
          [
            "Solidity compilation",
            "Compilation output for supported verified source"
          ],
          [
            "Slither",
            "Detector observations, severity classifications and affected components"
          ],
          [
            "Foundry",
            "Offline builds and test/fuzz/invariant outcomes where a supported harness exists"
          ]
        ],
        "text": [
          "These observations are the reference point for agent reasoning. A successful compilation does not prove correct accounting, a proxy lookup is not exhaustive protocol mapping, and a detector's severity does not establish actual loss."
        ]
      },
      {
        "title": "Specialist reasoning layer",
        "text": [
          "Five AI-assisted stages apply model reasoning within the nine-agent architecture: Static Analyst, Invariant Agent, Economic Agent, Critic and Reporter. Each has a distinct task and receives a bounded structured Evidence Pack with references to observations.",
          "Static and Invariant examine supported source and detector evidence. Economic connects findings to accounting and impact assumptions. Critic challenges real candidates against reproduction evidence and available earlier conclusions. Reporter synthesises the resulting evidence and limitations.",
          "This lets WHITEHAT connect otherwise isolated signals without handing the model unrestricted control. Cross-component reasoning depends on the contract context actually supplied; it is not an exhaustive multi-contract execution model."
        ]
      },
      {
        "title": "Challenge before synthesis",
        "text": [
          "Later stages do not merely repeat earlier text. The Critic explicitly examines false-positive risk, missing conditions, contradictions and overstatement. The Reporter must preserve uncertainty, separate reproduced behaviour from hypotheses and identify what still requires human validation.",
          "Agent conclusions remain candidates. Source, comments and protocol metadata are untrusted data, never instructions. Model reasoning cannot authorise arbitrary commands, transactions, exploitation or external disclosure."
        ]
      },
      {
        "title": "Controlled execution",
        "text": [
          "Invariant and fuzz testing search for violations of encoded properties; simulation adds independent reproduction evidence. Safe execution requires a supported harness and reviewed scope. The beta executes controlled repository-fixture tests; unsupported real-target execution remains LIMITED."
        ],
        "links": [
          [
            "The nine agents",
            "agents"
          ],
          [
            "Public beta and limitations",
            "beta"
          ],
          [
            "Reading investigation results",
            "results"
          ]
        ]
      }
    ]
  },
  {
    "slug": "scouts",
    "title": "Scouts and attribution",
    "description": "Wallet identity, first-Scout attribution, duplicate submissions and the intended 50/50 bounty allocation.",
    "group": "Protocol",
    "sections": [
      {
        "title": "What a Scout does",
        "text": [
          "A Scout identifies a protocol or contract worth investigating and supplies useful context, such as the official security program. Coding expertise is not required to submit an address. Submitting is not permission for live exploitation.",
          "Wallet sign-in associates submissions with an address. The application does not request a seed phrase or private key. A signed login message proves control of the address for that session; it does not establish target ownership or testing authorisation."
        ]
      },
      {
        "title": "First-Scout attribution",
        "text": [
          "The database records the originating Scout for a target identified by chain and contract address. Duplicate submissions preserve that original attribution rather than overwriting it. A later submission can appear in a Scout's history without changing the originator.",
          "Attribution identifies the potential recipient if an eligible investigation produces a successful bounty. It is not proof of eligibility, an unconditional payment claim or a guarantee that a finding will be accepted. Final qualification requires Whitehat review and the protocol's security-program rules.",
          "The optional onchain registry flow is separate and currently TESTNET only. It does not turn database attribution into a mainnet reward contract."
        ]
      },
      {
        "title": "After submitting",
        "text": [
          "A persistent investigation is created or returned for a duplicate target. Read-only Recon is queued for new investigations; deeper analysis needs scope review. Closing the browser does not erase the submission. The Scout profile shows persisted submission/history information.",
          "Private evidence and unresolved reports remain restricted to approved reviewers, including for the originating Scout. Public status is intentionally less detailed than the private investigation record."
        ]
      },
      {
        "title": "Intended allocation",
        "rows": [
          [
            "Scout",
            "50% of the eligible bounty amount actually received"
          ],
          [
            "WHITEHAT buyback",
            "50% allocated to token buybacks"
          ]
        ],
        "text": [
          "This is the protocol's intended production model. Existing distribution and buyback transactions are testnet mock demonstrations. There is no promise of a production payment, token price increase or return. Operations must not silently change the 50/50 allocation."
        ],
        "links": [
          [
            "Token economics",
            "token"
          ],
          [
            "Contracts and networks",
            "contracts"
          ]
        ]
      }
    ]
  },
  {
    "slug": "token",
    "title": "$WHITEHAT",
    "description": "The intended security-activity buyback model, with production contract address pending launch.",
    "group": "Protocol",
    "sections": [
      {
        "title": "Production CA: Pending launch",
        "text": [
          "The production Pons contract address has not been supplied. No production token address is published here. Do not use a testnet address as the production token address. A verified production entry and Pons link will be added after launch details are provided."
        ]
      },
      {
        "title": "Downstream of security activity",
        "text": [
          "$WHITEHAT is intended to connect token demand to successful security activity. In the proposed loop, an eligible bounty actually received funds the originating Scout's 50% allocation and the remaining 50% funds WHITEHAT buybacks.",
          "The mechanism depends on real accepted findings and received bounties. More investigations or tool findings alone do not create revenue. A buyback policy does not guarantee market demand, liquidity, token appreciation or returns."
        ]
      },
      {
        "title": "What is implemented today",
        "text": [
          "The repository contains a fixed-supply testnet token and testnet registry, distributor, vault and executor contracts. The recorded testnet token supply is 1,000,000,000 WHITEHAT. That test implementation must not be read as a verified production launch allocation or Pons supply commitment.",
          "The economic demonstration used mock assets and a test-only router. It is not a production DEX integration or evidence of recovered bounty revenue. No additional staking yield, burn schedule or allocation is asserted by these docs."
        ],
        "links": [
          [
            "Verified testnet directory",
            "contracts"
          ],
          [
            "Scout allocation",
            "scouts"
          ]
        ]
      }
    ]
  },
  {
    "slug": "contracts",
    "title": "Contract directory",
    "description": "Production deployment status and repository-recorded Robinhood Chain Testnet contracts, clearly separated.",
    "group": "Protocol",
    "sections": [
      {
        "title": "Mainnet / production",
        "text": [
          "Deployment pending. Production CA: Pending launch. No production Pons address has been supplied. The testnet contracts below are not production token, reward or buyback contracts."
        ]
      },
      {
        "title": "TESTNET deployments",
        "text": [
          "The directory below uses the repository's recorded deployment manifest for Robinhood Chain Testnet, chain ID 46630. The manifest records verification on 14 September 2026; these are deployment records, not a fresh audit or a guarantee about current permissions.",
          "Explorer links and copy buttons are provided for reference. Do not send real assets to testnet demonstration contracts."
        ]
      },
      {
        "title": "Mock economic demonstration",
        "text": [
          "Separate MockUSDC and TestOnlyRouter contracts were used for a TEST ONLY economic demonstration. They are mock infrastructure, not production assets or liquidity. The recorded demonstration disabled the mock router after use."
        ]
      }
    ]
  },
  {
    "slug": "architecture",
    "title": "Architecture",
    "description": "How WHITEHAT separates Scout participation, coordinated investigation and private evidence review.",
    "group": "Reference",
    "sections": [
      {
        "title": "From Scout signal to reviewed evidence",
        "steps": [
          "Scout",
          "Target submission",
          "Investigation queue",
          "Recon + protocol mapping",
          "Specialist security agents",
          "Deterministic security tooling",
          "Evidence synthesis + adversarial review",
          "Human review + responsible disclosure"
        ],
        "text": [
          "This is the product flow, not a claim that tools run only after agents. Deterministic tools supply observations throughout the investigation; specialist roles interpret and challenge what those observations mean."
        ]
      },
      {
        "title": "Separate application and analysis runtimes",
        "text": [
          "WHITEHAT separates the public application from the security analysis environment. The web application handles Scouts, submissions, investigation state and public progress. Submitted targets enter a dedicated investigation queue before being claimed by WHITEHAT's analysis runtime.",
          "The analysis layer coordinates specialist agents, deterministic security tools and chain data to build an evidence-backed view of the target.",
          "Findings, events and investigation state are persisted independently so the public interface can display progress without exposing private analysis material or granting direct access to the execution environment. The analysis runtime exposes no public inbound execution interface."
        ]
      },
      {
        "title": "Evidence moves between roles",
        "text": [
          "Recon and Cartographer establish the target context. Security tools produce structured observations. Specialist analysis roles develop candidates, while controlled tests can add reproduction evidence where supported. Critic challenges the evidence and conclusions; Reporter assembles the result for review.",
          "Each stage has a defined responsibility. Not all nine roles use model inference: five AI-assisted stages sit alongside deterministic mapping and controlled execution. The architecture coordinates these perspectives rather than treating one general-purpose answer as an investigation."
        ]
      },
      {
        "title": "Persistence and scope",
        "text": [
          "Queued investigations use claims and heartbeats so progress is associated with the active job. Scope changes can invalidate work that is no longer authorised. Refreshing the interface reads saved state rather than restarting the investigation.",
          "Interrupted work requires operator review and requeueing. Public progress remains separate from private tool output, findings and reports."
        ],
        "links": [
          [
            "How an investigation works",
            "how-it-works"
          ],
          [
            "Safety boundaries",
            "security"
          ],
          [
            "Beta limits",
            "beta"
          ]
        ]
      }
    ]
  },
  {
    "slug": "networks",
    "title": "Supported networks",
    "description": "Robinhood Chain mainnet and testnet IDs, read-only investigations and testnet-only transactions.",
    "group": "Reference",
    "sections": [
      {
        "title": "Network configuration",
        "rows": [
          [
            "Robinhood Chain mainnet",
            "4663",
            "Read-only reconnaissance; no production WHITEHAT contract deployment recorded"
          ],
          [
            "Robinhood Chain Testnet",
            "46630",
            "Read-only reconnaissance and explicitly labelled testnet contract interactions"
          ]
        ],
        "text": [
          "These IDs and explorer links come from the current repository configuration. Mainnet research support does not mean the WHITEHAT token or reward contracts are deployed on mainnet."
        ]
      },
      {
        "title": "Reads versus transactions",
        "text": [
          "Wallet sign-in uses an offchain message. Target submission writes to the application database. Recon reads chain data; it does not sign or send target transactions.",
          "The optional registry interaction requests an explicit wallet transaction on chain 46630. It may require testnet gas. The token and mock buyback demonstration are testnet-only. Nothing in the investigation pipeline authorises a live exploit or a mainnet transfer."
        ],
        "links": [
          [
            "Contract directory",
            "contracts"
          ],
          [
            "Official explorer links",
            "links"
          ]
        ]
      }
    ]
  },
  {
    "slug": "results",
    "title": "Understanding investigation results",
    "description": "How to interpret status, agent progress, tool findings, human validation and private reports without overstating vulnerabilities.",
    "group": "Analysis",
    "sections": [
      {
        "title": "Completion is not confirmation",
        "text": [
          "A tool finding is not necessarily a confirmed vulnerability. An investigation may contain hundreds of deterministic detector observations: duplicates, coding patterns, informational notices, unreachable paths or issues whose impact has not been demonstrated.",
          "COMPLETE means processing ended, not that the target is safe or that every candidate is exploitable. HUMAN REVIEW REQUIRED means a reviewer still needs to assess evidence. Finding counts must never be presented as a count of confirmed hacks or recovered bounties."
        ]
      },
      {
        "title": "Investigation and agent status",
        "rows": [
          [
            "QUEUED / RUNNING",
            "Waiting for the analysis runtime or processing permitted work"
          ],
          [
            "COMPLETE",
            "The operation ended; read its limitations and review state"
          ],
          [
            "LIMITED",
            "Coverage or evidence is incomplete, including unsupported tests or unavailable AI"
          ],
          [
            "BLOCKED / REVIEW",
            "Scope or operator review prevents further work"
          ],
          [
            "FAILED / INTERRUPTED",
            "Processing did not finish normally; an operator may need to investigate and requeue"
          ]
        ],
        "text": [
          "Agent status and overall investigation status are separate. A completed investigation can include LIMITED stages. The public page shows the persisted stage and agent progress; it does not expose all private tool output."
        ]
      },
      {
        "title": "What visitors can see",
        "text": [
          "Public information includes target identity, chain, originating Scout, investigation status, agent progress and an explicitly public summary. The validated count is based on human review status, not the total detector count.",
          "Public evidence is intentionally limited. Source bundles, raw traces, unresolved findings, Scout notes and private reports are not exposed in ordinary public investigation responses. A connected Scout wallet does not unlock private review data."
        ]
      },
      {
        "title": "How reviewers assess a finding",
        "text": [
          "Private reviewers can examine the detector, affected component, severity, confidence, supporting evidence, reproduction results and Critic outcome. Tool severity and model confidence are hypotheses about risk, not substitutes for impact evidence.",
          "A reviewer must consider reachability, access control, intended behaviour, duplicate reports, test realism and security-program scope. An isolated fixture failure proves a fixture property failed; it does not prove that a live protocol can be exploited.",
          "Automated VALIDATED labels from reproducible fixture tests remain distinct from the database's human validation decision. A reviewer can reject a claim or request more evidence. No AI stage automatically sets human validation."
        ]
      },
      {
        "title": "Reports and disclosure",
        "text": [
          "The Reporter prepares bounded private evidence summaries. Large logs and full source are not reproduced in public reports. AI failure can leave the deterministic report available while the AI portion is LIMITED.",
          "A human-validated finding can support a private disclosure draft. Draft preparation is not external delivery. A responsible disclosure, acceptance and eligible bounty are separate steps requiring human handling."
        ],
        "links": [
          [
            "Safety and disclosure",
            "security"
          ],
          [
            "Agent roles",
            "agents"
          ],
          [
            "Beta limits",
            "beta"
          ]
        ]
      }
    ]
  },
  {
    "slug": "security",
    "title": "Safety and responsible disclosure",
    "description": "Defensive scope, isolated execution, human validation and private handling of security research.",
    "group": "Reference",
    "sections": [
      {
        "title": "Defensive research only",
        "text": [
          "WHITEHAT is built for defensive security research. Submitting a third-party address does not grant testing permission. Public targets receive conservative read-only reconnaissance; deeper analysis requires explicit operator scope review.",
          "The system must not autonomously exploit live protocols. Current execution of fuzz/invariant tests and simulation is limited to the repository-owned fixture. No model-generated command or exploit is executed against a live target."
        ]
      },
      {
        "title": "Scope and evidence",
        "text": [
          "Reviewers consider the protocol's security program, allowed and excluded contracts and testing restrictions. Finding a proxy implementation does not silently authorise testing additional addresses.",
          "Untrusted source, comments, READMEs and metadata are evidence inputs, never instructions to the AI or worker. Deterministic observations remain authoritative. AI summaries are concise conclusions, not chain-of-thought disclosures or validation authority."
        ]
      },
      {
        "title": "Human review is mandatory",
        "text": [
          "Automated candidates can be false positives. Before treating a finding as confirmed, a reviewer assesses reproducibility, real impact, reachability and eligibility. Even a supported finding is not automatically a bounty claim.",
          "The product records human review and disclosure transitions. It does not autonomously send disclosures, transfer real bounty funds or perform exploitation."
        ]
      },
      {
        "title": "Private research handling",
        "text": [
          "Unresolved evidence and private reports are reserved for approved reviewers. Public progress intentionally omits reproduction details and raw tool output, including for signed-in Scouts. Hiding an Admin navigation link is not an access-control mechanism: server-side authorisation protects review functionality.",
          "Responsible disclosure means handling credible findings privately through the applicable protocol security program and respecting its testing and publication requirements. No automated publication schedule or response-time guarantee is promised."
        ],
        "links": [
          [
            "Understanding results",
            "results"
          ],
          [
            "Current limitations",
            "beta"
          ]
        ]
      }
    ]
  },
  {
    "slug": "beta",
    "title": "Public beta and limitations",
    "description": "Current compiler, execution, availability and review limitations of the WHITEHAT public beta.",
    "group": "Reference",
    "sections": [
      {
        "title": "What public beta means",
        "text": [
          "The public interface supports wallet sign-in, persistent target submissions, scoped investigations and progress views. WHITEHAT's analysis runtime coordinates nine specialist roles, including five model-assisted stages. Availability and coverage are not guaranteed; this is not a replacement for a commissioned comprehensive audit."
        ]
      },
      {
        "title": "Current coverage",
        "rows": [
          [
            "Verified source",
            "Real-target analysis currently supports Solidity 0.8.26; unsupported or missing source limits analysis"
          ],
          [
            "Proxy mapping",
            "Limited EIP-1967 inspection, not exhaustive proxy detection"
          ],
          [
            "Fuzzing / simulation",
            "Controlled fixture execution; no automatic third-party harness generation"
          ],
          [
            "Deeper analysis",
            "Operator-reviewed scope and explicit queueing required"
          ],
          [
            "AI availability",
            "Timeouts/unavailability produce limitations; deterministic evidence remains authoritative"
          ],
          [
            "Evidence access",
            "Public progress only; unresolved evidence and reports are private"
          ],
          [
            "Recovery",
            "Interrupted jobs require operator review/requeue"
          ],
          [
            "Economics",
            "Production contracts pending; existing contracts and mock flows are TESTNET"
          ]
        ],
        "text": [
          "A lack of findings does not establish safety. Tool counts do not establish vulnerabilities. Compiler success does not establish test coverage."
        ]
      },
      {
        "title": "Availability and expectations",
        "text": [
          "Upstream RPC/explorer responses, analysis-runtime availability and model capacity can delay or limit results. The system uses bounded work and output limits. Closing the website does not stop a persisted investigation, but an unavailable analysis runtime cannot process it.",
          "The beta promises no guaranteed completion time, bounty, recovery amount or investment return."
        ],
        "links": [
          [
            "Results guide",
            "results"
          ],
          [
            "Frequently asked questions",
            "faq"
          ]
        ]
      }
    ]
  },
  {
    "slug": "faq",
    "title": "Frequently asked questions",
    "description": "Plain-English answers about submissions, Scouts, evidence, safety, rewards and token addresses.",
    "group": "Reference",
    "sections": [
      {
        "title": "What is WHITEHAT?",
        "text": [
          "A defensive DeFi security intelligence network that combines Scouts, deterministic tooling, AI-assisted analysis and human review."
        ]
      },
      {
        "title": "What is a Scout?",
        "text": [
          "Someone who surfaces a protocol or contract for investigation. Wallet attribution identifies the originating Scout without promising a reward."
        ]
      },
      {
        "title": "Who can submit a target?",
        "text": [
          "A user who connects an EVM wallet and completes the offchain sign-in can submit a supported-chain address. Rate limits and scope review apply."
        ]
      },
      {
        "title": "Does submitting cost anything?",
        "text": [
          "The current submission flow requests no payment or blockchain transaction. The separate optional testnet registry transaction requires testnet gas. This is not a promise about future fees."
        ]
      },
      {
        "title": "Is WHITEHAT an auditor?",
        "text": [
          "The beta provides security research and intelligence, not a comprehensive audit certification or guarantee that a protocol is safe."
        ]
      },
      {
        "title": "Does it automatically exploit vulnerabilities?",
        "text": [
          "No. Public Recon is read-only; current controlled execution is restricted to the repository fixture. No autonomous live exploitation is supported."
        ]
      },
      {
        "title": "Are findings automatically confirmed?",
        "text": [
          "No. Detector findings and AI conclusions are candidates. Reproduction and human review are necessary before a finding is treated as confirmed."
        ]
      },
      {
        "title": "What happens if a vulnerability is found?",
        "text": [
          "An approved reviewer assesses it and may prepare a private disclosure draft. Humans handle disclosure through the applicable security program; bounty acceptance is not guaranteed."
        ]
      },
      {
        "title": "How do Scout rewards work?",
        "text": [
          "The intended model splits eligible bounty amounts actually received: 50% to the originating Scout and 50% to WHITEHAT buybacks. Production economics are not yet deployed; existing mock flows are TESTNET."
        ]
      },
      {
        "title": "What is $WHITEHAT used for?",
        "text": [
          "Its proposed economic role is the bounty-funded buyback mechanism. These docs make no additional yield, allocation or price promises."
        ]
      },
      {
        "title": "What networks are supported?",
        "text": [
          "The supported read-only networks are Robinhood Chain mainnet 4663 and testnet 46630. Current WHITEHAT contract interactions are testnet-only."
        ]
      },
      {
        "title": "Where is the official contract address?",
        "text": [
          "Production CA: Pending launch. Use the Contracts page for explicitly labelled testnet records. Do not treat a testnet address as the production Pons token."
        ]
      },
      {
        "title": "Continue reading",
        "links": [
          [
            "Contract directory",
            "contracts"
          ],
          [
            "Official links",
            "links"
          ],
          [
            "Safety",
            "security"
          ]
        ]
      }
    ]
  },
  {
    "slug": "links",
    "title": "Official links",
    "description": "The WHITEHAT website, repository and configured Robinhood Chain explorers; production Pons link pending.",
    "group": "Reference",
    "sections": [
      {
        "title": "Use verified destinations",
        "text": [
          "The official website is https://whitehat.run. The repository is https://github.com/TehWhitehat/whitehat. Explorer destinations below match the current network configuration.",
          "No X/Twitter profile is configured in the repository/site reviewed for these docs, so none is invented here. The Pons launch link and production contract address are pending and will be added once supplied."
        ]
      }
    ]
  }
];
