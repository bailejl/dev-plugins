---
name: dora-metrics
description: DORA metrics knowledge — deployment frequency, lead time, MTTR, and change failure rate. Use when evaluating git health or delivery performance.
user-invocable: false
---

# DORA Metrics Knowledge

This skill provides knowledge about DORA (DevOps Research and Assessment) metrics, performance bands, and how git patterns correlate with delivery performance.

---

## The Four Key Metrics

DORA research (Forsgren, Humble, Kim — *Accelerate*, 2018) identified four metrics that reliably predict software delivery performance and organizational outcomes:

### 1. Deployment Frequency

How often code is deployed to production.

| Performance Band | Frequency |
|-----------------|-----------|
| **Elite** | On-demand, multiple times per day |
| **High** | Between once per day and once per week |
| **Medium** | Between once per week and once per month |
| **Low** | Less than once per month |

**Git proxy**: Commit-to-main frequency, tag/release cadence.

### 2. Lead Time for Changes

Time from code commit to code running in production.

| Performance Band | Lead Time |
|-----------------|-----------|
| **Elite** | Less than one hour |
| **High** | Between one day and one week |
| **Medium** | Between one week and one month |
| **Low** | More than one month |

**Git proxy**: Branch lifespan, PR open duration, merge-to-deploy interval.

### 3. Mean Time to Restore (MTTR)

Time to recover from a production failure.

| Performance Band | MTTR |
|-----------------|------|
| **Elite** | Less than one hour |
| **High** | Less than one day |
| **Medium** | Between one day and one week |
| **Low** | More than one week |

**Git proxy**: Time between revert commit and fix commit, hotfix frequency.

### 4. Change Failure Rate

Percentage of deployments that cause a failure in production.

| Performance Band | Failure Rate |
|-----------------|-------------|
| **Elite** | 0–15% |
| **High** | 0–15% |
| **Medium** | 16–30% |
| **Low** | >30% |

**Git proxy**: Revert rate, hotfix branch frequency, rapid-fix-after-deploy pattern.

---

## Key Research Findings

The core insight from a decade of DORA research:

> Teams with short-lived branches (under 24 hours), daily commits to trunk, and small batch sizes consistently outperform those practicing feature branching — by margins of **182x faster deployment frequency** and **127x faster lead times**.

### Performance Multipliers

| Practice | Elite vs Low Performance Gap |
|----------|------------------------------|
| Deployment frequency | 182x more frequent |
| Lead time for changes | 127x faster |
| Mean time to restore | 2,604x faster |
| Change failure rate | 7x lower |

### These metrics are **correlated, not independent**:
- Teams that deploy more frequently have *lower* failure rates (not higher).
- Faster lead times correlate with faster recovery.
- Throughput and stability reinforce each other.

---

## Git Patterns and DORA Correlation

### Patterns That Correlate with Elite Performance

| Git Pattern | DORA Impact | Why |
|------------|-------------|-----|
| Trunk-based development | Elite deployment frequency | Eliminates merge overhead, enables continuous flow |
| Branches < 24 hours | Elite lead time | Short feedback loops, minimal integration debt |
| Small commits (< 200 lines) | Lower change failure rate | Easier to review, test, and bisect |
| Daily commits to main | Elite deployment frequency | True continuous integration |
| Automated merge (CI green → deploy) | Elite lead time | Removes manual bottleneck |
| Feature flags over branches | Elite all metrics | Decouples deployment from release |

### Patterns That Correlate with Low Performance

| Git Pattern | DORA Impact | Why |
|------------|-------------|-----|
| Long-lived feature branches (> 7 days) | Low lead time | Integration debt accumulates |
| Branch-per-environment | Low deployment frequency | Violates "build once, deploy everywhere" |
| Cherry-pick promotion | Low change failure rate | Different artifacts in each environment |
| GitFlow with long-lived branches | Medium at best | Ceremony overhead discourages small batches |
| Mandatory squash merging | Impairs MTTR | Destroys bisect capability |
| Infrequent commits (weekly) | Low deployment frequency | Batching is the opposite of flow |
| Code freeze periods | Low deployment frequency | Elite teams never freeze |
| High revert rates (> 15%) | Low change failure rate | Indicates quality pipeline failures |

---

## Trunk-Based Development Benefits

Bryan Finster's Minimum CD principles and Martin Fowler's CI definition both require:

1. **Integration at least daily** — branches should be short-lived (< 24 hours ideal)
2. **Commit to trunk** — not to long-lived feature branches
3. **Always green trunk** — main branch should always be deployable
4. **Feature flags** — use flags to hide incomplete features, not branches
5. **Small batches** — frequent, small changes over large, infrequent ones

### Why Trunk-Based Works

- **50%+ merge conflict probability** when branches live > 3 days
- **Integration failure guaranteed** when branches live > 30 days
- Merge conflicts scale **quadratically** with branch count and age
- Code review quality **degrades** with PR size (research: > 400 lines = diminishing returns)

---

## Using DORA in Audits

When performing a git health audit:

1. **Measure the proxies** — branch age, commit frequency, revert rate, release cadence
2. **Map to DORA bands** — Elite / High / Medium / Low
3. **Identify the bottleneck** — which metric is the weakest?
4. **Prioritize by impact** — improvements to the weakest metric yield the largest gains
5. **Track over time** — DORA metrics are trend indicators, not point-in-time scores

### References

- Forsgren, N., Humble, J., Kim, G. (2018). *Accelerate: The Science of Lean Software and DevOps*
- DORA State of DevOps Reports (2014–2024)
- Finster, B. et al. "Minimum CD" — minimumcd.org
- Fowler, M. "Continuous Integration" — martinfowler.com
- Humble, J., Farley, D. (2010). *Continuous Delivery*
