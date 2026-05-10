# BULK — HumanityLink Bulk Aid Issuance

Leo programs that batch-issue HumanityLink `AidRecord`s in a single transaction,
plus the orchestration scripts that drive a multi-lane distribution.

The bulk programs are thin wrappers around `humanity_link_aid_v*.aleo::issue_aid`.
Instead of one tx per beneficiary, one tx pushes out `N` aid records, which
collapses fee cost and wall-clock time during a distribution event.

---

## Repository layout

```
BULK/
├── bulk_hybrid/          # v8d-era wrapper. Leo 4.0, Final-based finalization.
│   ├── src/main.leo      # bulk_issue_8 + bulk_issue_15 (uses USDCx + ComplianceRecord)
│   ├── tests/            # Leo @test cases
│   ├── scripts/          # Multi-lane distribution orchestrator (Node.js)
│   │   ├── setup-hybrid-distribution.mjs
│   │   ├── run-hybrid-distribution.mjs
│   │   ├── provable-scanner.mjs
│   │   ├── recipients.json
│   │   └── lane-accounts/
│   └── program.json      # → humanity_link_bulk_v8d.aleo
│
├── bulk_issue_1/         # v7-era wrappers. Leo 3.4, Future/await finalization.
├── bulk_issue_2/         # Each variant fixes the recipient count at compile time;
├── bulk_issue_5/         # pick the smallest `N` ≥ what you need so you don't
├── bulk_issue_10/        # waste constraints on padding inputs.
└── bulk_issue_15/
```

Each `bulk_issue_N/` is an independent Leo project (`leo build` / `leo deploy`
inside the folder). They differ only in the input arity of `bulk_issue` and
the number of `Future.await()` calls inside `finalize_bulk_issue`.

---

## How it works

Every variant exposes a single transition:

```leo
async transition bulk_issue(s0: Issuance, s1: Issuance, ...) -> (
    AidRecord, AidRecord, ..., Future
)
```

`Issuance` is `{ recipient: address, amount: u64, tag: u8 }`. Inside the
transition each slot calls `humanity_link_aid_v*.aleo/issue_aid(...)`, returning
an `AidRecord` private to that recipient and a `Future`. All futures are passed
to `finalize_bulk_issue`, which sequentially `.await()`s them so every issuance
either commits as part of the same finalize block, or the whole tx reverts.

The output count caps how big `N` can be: Leo allows up to 16 outputs per
function, and the finalize/Future itself takes one slot — hence the v7 ladder
ends at **15** and the v8d Leo-4.0 wrapper exposes both `bulk_issue_8` and
`bulk_issue_15`.

### v7 vs v8d differences

| Aspect            | `bulk_issue_*_v7`                          | `bulk_hybrid` (v8d)                               |
|-------------------|--------------------------------------------|---------------------------------------------------|
| Leo version       | 3.4.0                                       | 4.0                                               |
| Aid contract      | `humanity_link_aid_v7.aleo`                 | `humanity_link_aid_v8d.aleo`                      |
| Stablecoin        | (handled inside aid contract)               | imports `test_usdcx_stablecoin.aleo` directly      |
| Finalization      | `async function` + `Future.await()`         | `Final` block with `f.run()`                      |
| `issue_aid` return | `(AidRecord, Future)`                       | `(ComplianceRecord, Token, AidRecord, Final)`     |
| Recipient counts   | 1, 2, 5, 10, 15                             | 8, 15                                             |

Mainnet swap for `bulk_hybrid`: replace `test_usdcx_stablecoin.aleo` with
`usdcx_stablecoin.aleo` in `src/main.leo` and `program.json`.

---

## Deploy & authorize a bulk program

Inside any `bulk_issue_*/` or `bulk_hybrid/`:

```bash
# 1. compile
leo build

# 2. deploy
leo deploy --network testnet --broadcast

# 3. authorize the bulk program as an issuer on the underlying aid contract
#    (the aid contract checks `caller` against its issuer mapping, so the
#    bulk program's address must be whitelisted there)
leo execute authorize_issuer \
    aleo1...bulk_program_address... \
    --network testnet --broadcast \
    --program humanity_link_aid_v7.aleo   # or v8d
```

After step 3 the bulk contract can be invoked by any address authorized to
call it (typically the lane wallets created by the orchestrator).

---

## The hybrid lane orchestrator

`bulk_hybrid/scripts/` is what you actually run during a distribution. The
"hybrid" name refers to the strategy: `c` parallel lane wallets each fan out
serial batches of size `N` (default 16). Throughput is `c × N` aid records per
tx round, bounded by lane parallelism rather than by the `N`-output ceiling.

### One-time setup

```bash
cd bulk_hybrid/scripts
npm install
cp .env.example .env  # fill in PROVABLE_API_KEY / PROVABLE_CONSUMER_ID etc.
```

### Per-distribution run

```bash
# 1) provision lane wallets, fund credits, split USDCx, mint compliance,
#    authorize each lane as issuer
node setup-hybrid-distribution.mjs \
    --lanes 4 \
    --recipients 200 \
    --amount 10

# 2) execute the distribution against a recipient list
node run-hybrid-distribution.mjs \
    --lanes 4 \
    --recipients recipients.json
```

Both scripts accept `--dryrun` for a no-broadcast plan.

`recipients.json` is a flat array:

```json
[
  { "address": "aleo1...", "amount": 10 },
  { "address": "aleo1...", "amount": 10 }
]
```

### Crash safety

`run-hybrid-distribution.mjs` appends to `distribution-results-<timestamp>.jsonl`
as each batch confirms. On re-run, already-confirmed txs are skipped, so a
mid-distribution crash, expired API key, or dropped RPC connection is recoverable
by re-invoking the same command.

---

## Picking which bulk variant to deploy

- **One-off / migration scripts** → `bulk_issue_1` or `bulk_issue_2`.
- **Small NGO drop (≤ 50 beneficiaries)** → deploy `bulk_issue_15` once and call it 4×.
- **Production v8d distribution** → `bulk_hybrid` + the lane orchestrator.
  Use `bulk_issue_15` when you need every output slot; `bulk_issue_8` is cheaper
  to prove if your batch size sits at 8.
- Don't deploy `bulk_issue_5` / `bulk_issue_10` unless you specifically want
  those arities — `bulk_issue_15` strictly dominates them on per-recipient cost.

---

## Caveats

- The `tests/test_bulk_hybrid.leo` file calls `bulk_hybrid.aleo::main` and is a
  scaffolded placeholder, not a real test of `bulk_issue_*`. Real testing is
  done end-to-end via the orchestrator against testnet.
- `bulk_hybrid` imports `test_usdcx_stablecoin.aleo` — remember to swap to the
  production stablecoin before mainnet deploy.
- The `// TESTNET` blocks at the top of each `test.sh` are notes / runbooks,
  not executable bash. Treat them as deploy commentary.
- Output limit is 16 per function in Leo 4.0. If you need batches > 15, fan out
  across more lanes — don't try to extend `bulk_issue_N` further.
