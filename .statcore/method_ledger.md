# StatCore Method Pattern Ledger

Schema version: v1.0
Charter: CLAUDE.md v1.0
Created: 2026-05-03

This file is the persistent memory of solution scaffolds. Append-only, except
when a user issues `revise pattern MP-XX`. Every entry follows the schema in
§3.3 of CLAUDE.md.

---

## Index

| MP-ID | Class | Versions | Last touched |
|-------|-------|----------|--------------|
| MP-16a | Wilcoxon Rank-Sum / Mann-Whitney — rank-sum computation only | v1.0 | 2026-05-03 |

---

## MP-16a — Wilcoxon Rank-Sum / Mann-Whitney, rank-sum computation only  (v1.0)

**Trigger phrases:** "identify the rank sum", "rank sum R1", "R_1 of the sample",
"compute R for sample 1", Wilcoxon rank-sum subtask, Mann-Whitney U preliminary.

**Required inputs:**
- Sample 1 values, vector of length n_1
- Sample 2 values, vector of length n_2

**Assumptions to verify:**
1. Both samples are independent.
2. Measurement scale is at least ordinal (ranks are meaningful).
3. No structural ties beyond what the rank tie-breaking rule (mid-rank) handles.

**Solution scaffold:**
Step 1. Pool the two samples into a single combined list of size N = n_1 + n_2,
        tagging each value with its source sample.
Step 2. Sort the combined list ascending. Assign ranks 1..N. For tied values,
        assign the average of the ranks they would occupy (mid-rank rule).
Step 3. Compute $R_1 = \sum_{i \in S_1} \text{rank}(x_i)$.
Step 4. Validate via the identity $R_1 + R_2 = \dfrac{N(N+1)}{2}$. If the
        identity fails, recompute.
Step 5. (Optional, for Mann-Whitney) compute
        $U_1 = R_1 - \dfrac{n_1(n_1+1)}{2}$ and $U_2 = R_2 - \dfrac{n_2(n_2+1)}{2}$.

**Decision rule:** N/A for the rank-sum subtask itself; the rank sum is an
intermediate statistic. Decision rules apply at the full Mann-Whitney /
Wilcoxon test stage (MP-16, to be added on first occurrence).

**Common pitfalls:**
- Forgetting the mid-rank rule for ties.
- Mixing the two samples and losing the source tag.
- Reporting U when R was asked for, or vice versa.
- Off-by-one on N when a sample has duplicates within itself.

**Worked anchor example (numbers redacted, structure preserved):**
Given S_1 = {a_1, ..., a_{n1}}, S_2 = {b_1, ..., b_{n2}}.
Pool, sort, rank. Sum the ranks belonging to S_1. Verify:
$R_1 + R_2 \stackrel{?}{=} \dfrac{(n_1+n_2)(n_1+n_2+1)}{2}$.

**Changelog:**
- v1.0 (2026-05-03): initial entry, created during first session problem
  (Week 4 Homework, Question 13.4.2).
