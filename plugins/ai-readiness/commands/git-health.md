---
description: Audit git repository health using the 71 anti-patterns framework with DORA-derived severity scoring across branching, commits, merges, and release patterns.
---

# Git Health Audit — 71 Anti-Patterns with DORA Severity Scoring

You are performing a comprehensive git repository health audit using the Git Anti-Patterns Framework v3.0. Analyze the repository's git history, branching patterns, commit hygiene, and delivery indicators to assess software delivery health. Detect anti-patterns using the git commands provided, apply DORA-derived severity scoring, and produce an actionable report.

**Core insight from DORA research**: Teams with short-lived branches (under 24 hours), daily commits to trunk, and small batch sizes consistently outperform feature-branching teams by 182x faster deployment frequency and 127x faster lead times.

---

## Severity Scoring System

| Level | Weight | Description |
|-------|--------|-------------|
| 🔴 CRITICAL | 20–25 | Blocks elite performance; immediate action required |
| 🟠 HIGH | 10–15 | Significant impediment to delivery; address within sprint |
| 🟡 MEDIUM | 5–10 | Suboptimal practice; schedule improvement work |
| 🟢 LOW | 1–5 | Minor issue; address opportunistically |

---

## Audit Execution

Run the detection commands in each category below. Record findings, apply severity thresholds, and accumulate the total score. Work through all 10 categories systematically.

---

## Category 1: Branching Anti-Patterns

### 1.1 Long-Lived Feature Branches (Anti-patterns #1–2)

**Why**: Martin Fowler's CI requires daily integration. Bryan Finster's Minimum CD: branches < 24 hours. Long-lived branches create merge complexity and integration debt.

**Detection:**
```bash
# List all branches with age
git for-each-ref --format='%(refname:short) %(committerdate:relative)' refs/heads/ refs/remotes/

# Calculate age in days for remote branches
git for-each-ref --format='%(refname:short) %(committerdate:unix)' refs/remotes/ | while read branch timestamp; do
  days=$(( ($(date +%s) - $timestamp) / 86400 ))
  echo "$branch: $days days old"
done | sort -t: -k2 -rn

# Branches not merged to main
git branch -r --no-merged origin/main

# Divergence for all branches
git for-each-ref --format='%(refname:short)' refs/remotes/ | grep -v HEAD | while read branch; do
  ahead=$(git rev-list --count origin/main..$branch 2>/dev/null || echo 0)
  behind=$(git rev-list --count $branch..origin/main 2>/dev/null || echo 0)
  [ $ahead -gt 0 ] && echo "$branch: ahead=$ahead, behind=$behind"
done | sort -t= -k2 -rn
```

**Severity:**

| Branch Age | Severity | Weight |
|------------|----------|--------|
| < 1 day | ✅ Elite | 0 |
| 1–3 days | 🟡 MEDIUM | 5 |
| 3–7 days | 🟠 HIGH | 15 |
| > 7 days | 🔴 CRITICAL | 25 |
| > 30 days | 🔴 SEVERE | 25 |

---

### 1.2 Branch-Per-Environment (Anti-patterns #3–4)

**Why**: "Using Git branches for modeling different environments is an anti-pattern" (Codefresh). Violates "build once, deploy everywhere."

**Detection:**
```bash
# Detect environment-named branches
git branch -r | grep -iE '(dev|develop|staging|stage|uat|qa|test|preprod|pre-prod|production|prod)$'

# Check divergence from main
for branch in dev develop staging uat qa production prod; do
  if git rev-parse --verify origin/$branch &>/dev/null; then
    ahead=$(git rev-list --count origin/main..origin/$branch 2>/dev/null || echo "N/A")
    behind=$(git rev-list --count origin/$branch..origin/main 2>/dev/null || echo "N/A")
    echo "$branch: ahead=$ahead, behind=$behind"
  fi
done

# Check for unique commits in environment branches
for branch in dev staging uat production; do
  if git rev-parse --verify origin/$branch &>/dev/null; then
    unique=$(git log origin/$branch --not origin/main --oneline 2>/dev/null | wc -l)
    [ $unique -gt 0 ] && echo "WARNING: $branch has $unique commits not in main"
  fi
done
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Env branches exist but identical to main | 🟢 LOW | 5 |
| Env branches with unique commits | 🟠 HIGH | 15 |
| Cherry-picks between env branches | 🔴 CRITICAL | 25 |
| Hotfixes applied directly to prod branch | 🔴 CRITICAL | 25 |
| > 10 commits divergence between env branches | 🔴 CRITICAL | 25 |

---

### 1.3 Big Bang Merges (Anti-pattern #5)

**Why**: Large merges indicate batch accumulation — the opposite of continuous flow.

**Detection:**
```bash
# Find large merge commits
git log --merges --pretty=format:'%H %s' --since="6 months ago" | while read hash msg; do
  files=$(git diff --name-only $hash^..$hash 2>/dev/null | wc -l)
  if [ "$files" -gt 50 ]; then
    echo "BIG BANG: $hash ($files files) - $msg"
  fi
done

# Average merge size
git log --merges --pretty=format:'%H' --since="6 months ago" | while read hash; do
  git diff --shortstat $hash^..$hash 2>/dev/null
done | awk '/files? changed/ {total+=$1; count++} END {if(count>0) print "Avg files per merge:", total/count}'
```

**Severity:**

| Merge Size | Severity | Weight |
|------------|----------|--------|
| < 20 files | ✅ Normal | 0 |
| 20–50 files | 🟡 MEDIUM | 5 |
| 50–100 files | 🟠 HIGH | 15 |
| > 100 files | 🔴 CRITICAL | 20 |

---

### 1.4 Stale/Abandoned Branches (Anti-patterns #6–7)

**Why**: Stale branches clutter the repository, slow git operations, and create confusion.

**Detection:**
```bash
# Count total branches
echo "Total remote branches: $(git branch -r | wc -l)"

# Find stale branches (no commits in 90+ days)
git for-each-ref --sort=committerdate --format='%(committerdate:relative) %(refname:short)' refs/remotes/ | head -50

# Merged but not deleted
git branch -r --merged origin/main | grep -v main | grep -v HEAD
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| > 50 remote branches | 🟡 MEDIUM | 5 |
| > 100 remote branches | 🟠 HIGH | 10 |
| > 20 branches stale > 90 days | 🟠 HIGH | 10 |
| Merged but undeleted > 50% | 🟡 MEDIUM | 5 |

---

### 1.5 GitFlow Misuse (Anti-patterns #10–11)

**Why**: Thoughtworks placed "Long-lived branches with Gitflow" on their Technology Radar as avoid. GitFlow's develop branch delays integration; release branches encourage batching.

**Detection:**
```bash
# Detect GitFlow structure
git branch -r | grep -E 'origin/develop$' && echo "GitFlow detected"

# Check develop divergence
if git rev-parse --verify origin/develop &>/dev/null; then
  ahead=$(git rev-list --count origin/main..origin/develop 2>/dev/null || echo 0)
  behind=$(git rev-list --count origin/develop..origin/main 2>/dev/null || echo 0)
  echo "develop vs main: ahead=$ahead, behind=$behind"
fi

# Find release branches
git branch -r | grep -iE 'release[/-]' | while read branch; do
  age_days=$(( ($(date +%s) - $(git log -1 --format='%ct' $branch)) / 86400 ))
  echo "$branch: $age_days days old"
done

# Hotfix branch count
git branch -r | grep -iE 'hotfix[/-]' | wc -l | xargs echo "Hotfix branches:"

# Stale feature branches
git for-each-ref --format='%(refname:short) %(committerdate:unix)' refs/remotes/ | grep -iE 'feature[/-]' | while read branch timestamp; do
  days=$(( ($(date +%s) - $timestamp) / 86400 ))
  [ $days -gt 7 ] && echo "STALE FEATURE: $branch ($days days)"
done
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| GitFlow with frequent integration (< daily) | ✅ Acceptable | 0 |
| GitFlow with develop > 5 commits ahead | 🟡 MEDIUM | 10 |
| GitFlow with feature branches > 7 days | 🟠 HIGH | 15 |
| GitFlow with release branches > 14 days | 🟠 HIGH | 15 |
| GitFlow with > 3 hotfix branches/month | 🔴 CRITICAL | 20 |
| GitFlow on web app with CD aspirations | 🟠 HIGH | 15 |

---

## Category 2: Cherry-Picking & Merge Strategy Anti-Patterns

### 2.1 Cherry-Pick as Promotion Strategy (Anti-patterns #8–9)

**Why**: Cherry-picking creates duplicate commits with different SHAs, breaking git's detection of equivalent changes. Violates "same artifact" principle.

**Detection:**
```bash
# Commits with cherry-pick annotation
git log --all --grep="cherry picked from commit" --oneline | wc -l

# Duplicate commit messages (potential cherry-picks)
git log --all --format='%s' | sort | uniq -d | while read msg; do
  count=$(git log --all --oneline --grep="$msg" --fixed-strings 2>/dev/null | wc -l)
  [ $count -gt 1 ] && echo "DUPLICATE ($count): $msg"
done | head -20
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Occasional hotfix backport (< 5/quarter) | 🟡 MEDIUM | 5 |
| Regular cherry-picks (5–20/quarter) | 🟠 HIGH | 15 |
| Cherry-picks to promote through environments | 🔴 CRITICAL | 20 |
| > 20 duplicate commits detected | 🔴 CRITICAL | 20 |

---

### 2.2 Squash-Merge Abuse / Bisect Destruction (Anti-patterns #12–14)

**Why**: Mandatory squash-merging destroys git's most powerful debugging tool. Bisect's O(log n) efficiency becomes useless when each "commit" is hundreds of lines.

**Detection:**
```bash
# Find squash-merge suspects (large non-merge commits)
git log --no-merges --pretty=format:'%H' --since="6 months ago" | while read hash; do
  lines=$(git show --stat $hash 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+')
  files=$(git show --stat $hash 2>/dev/null | tail -1 | grep -oE '[0-9]+ files?' | grep -oE '[0-9]+')
  [ -n "$lines" ] && [ "$lines" -gt 500 ] && echo "SQUASH SUSPECT: $hash ($lines insertions, $files files)"
done | head -20

# Squash vs merge ratio
merges=$(git log --merges --oneline --since="6 months ago" | wc -l)
non_merges=$(git log --no-merges --oneline --since="6 months ago" | wc -l)
echo "Merge commits: $merges, Non-merge commits: $non_merges"

# Average commits per day
total=$(git log --oneline --since="6 months ago" | wc -l)
echo "Avg commits/day: $(echo "scale=1; $total / 180" | bc)"
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Squash merges with < 200 lines | ✅ Acceptable | 0 |
| Squash merges consistently > 500 lines | 🟠 HIGH | 15 |
| Squash merges consistently > 1000 lines | 🔴 CRITICAL | 20 |
| < 1 commit/day average (severe squashing) | 🟠 HIGH | 15 |
| Squash + no PR history preserved | 🔴 CRITICAL | 20 |

---

### 2.3 Rebase-Only Workflows / Merge Context Loss (Anti-pattern #15)

**Why**: Mandatory rebase-only destroys merge context that records when and how branches were integrated.

**Detection:**
```bash
# Merge commit ratio
total=$(git log --oneline --since="6 months ago" | wc -l)
merges=$(git log --merges --oneline --since="6 months ago" | wc -l)
ratio=$(echo "scale=2; $merges * 100 / $total" | bc)
echo "Merge commit ratio: $ratio% ($merges of $total)"
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Rebase for local cleanup before merge | ✅ Best Practice | 0 |
| < 5% merge commits in active repo | 🟡 MEDIUM | 5 |
| No merge commits at all (pure rebase) | 🟡 MEDIUM | 10 |
| Rebase-only + complex multi-team project | 🟠 HIGH | 15 |

---

## Category 3: Commit Hygiene Anti-Patterns

### 3.1 Oversized Commits (Anti-patterns #16–17)

**Why**: PRs over 400 lines receive diminishing review quality (Google/Microsoft research). Large commits hide defects and complicate bisect.

**Detection:**
```bash
# Find largest commits
git log --pretty=tformat:'%H %s' --numstat --since="6 months ago" | awk '
  /^[a-f0-9]{40}/ { if(adds+dels>0) print adds+dels, commit, msg; commit=$1; msg=substr($0,42); adds=0; dels=0 }
  /^[0-9]+/ { adds+=$1; dels+=$2 }
  END { if(adds+dels>0) print adds+dels, commit, msg }
' | sort -rn | head -20

# Size distribution
git log --shortstat --pretty=format:'' --since="6 months ago" | awk '
  /files? changed/ {
    match($0, /([0-9]+) insertion/, ins)
    match($0, /([0-9]+) deletion/, del)
    total = ins[1] + del[1]
    if(total < 50) small++
    else if(total < 200) medium++
    else if(total < 500) large++
    else xlarge++
  }
  END {print "Small(<50):", small+0, "Medium(50-200):", medium+0, "Large(200-500):", large+0, "XL(>500):", xlarge+0}
'
```

**Severity:**

| Commit Size | Severity | Weight |
|-------------|----------|--------|
| < 50 lines | ✅ Optimal | 0 |
| 50–200 lines | ✅ Good | 0 |
| 200–500 lines | 🟡 MEDIUM | 5 |
| 500–1000 lines | 🟠 HIGH | 10 |
| > 1000 lines | 🔴 CRITICAL | 20 |

---

### 3.2 Infrequent Commits (Anti-pattern #18)

**Why**: Jez Humble's CI test: "Do all developers commit to mainline at least once a day?"

**Detection:**
```bash
# Per-developer commit frequency (last 90 days)
git shortlog -sn --since="90 days ago" --no-merges | while read count author; do
  freq=$(echo "scale=2; $count / 90" | bc)
  echo "$author: $freq commits/day ($count total)"
done

# Low-frequency developers
git shortlog -sn --since="30 days ago" --no-merges | awk '$1 < 20 {print "LOW FREQUENCY:", $0}'
```

**Severity:**

| Frequency | Severity | Weight |
|-----------|----------|--------|
| Multiple daily | ✅ Elite | 0 |
| Daily | ✅ Acceptable | 0 |
| Every 2–3 days | 🟠 HIGH | 10 |
| Weekly or less | 🔴 CRITICAL | 20 |

---

### 3.3 Poor Commit Messages (Anti-patterns #19, #21–22)

**Why**: Commit messages are documentation. Poor messages make debugging and auditing impossible.

**Detection:**
```bash
# Low-quality messages
for pattern in "^WIP" "^wip" "^fix$" "^Fix$" "^temp" "^TODO" "^fixup" "^squash" "^asdf" "^test$" "^update$" "^changes$"; do
  count=$(git log --all --grep="$pattern" --oneline --since="6 months ago" | wc -l)
  [ $count -gt 0 ] && echo "$pattern: $count commits"
done

# Short messages (< 10 chars)
git log --format='%h %s' --since="6 months ago" | awk 'length($0) < 18 {print "SHORT:", $0}' | head -20

# Multi-concern messages ("and")
git log --grep=" and " --oneline --since="6 months ago" | head -10
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| > 10% WIP/fixup/temp commits | 🟠 HIGH | 10 |
| > 20% messages < 10 chars | 🟠 HIGH | 10 |
| No conventional commit format | 🟡 MEDIUM | 5 |
| > 30% missing issue references | 🟡 MEDIUM | 5 |

---

### 3.4 Commit Clustering / Sprint Pattern (Anti-pattern #20)

**Why**: Commit clustering indicates deadline-driven batching rather than continuous flow.

**Detection:**
```bash
# Commits by day of week
git log --format='%ad' --date=format:'%u %A' --since="6 months ago" | sort | uniq -c | sort -k2

# Commits by hour
git log --format='%ad' --date=format:'%H' --since="6 months ago" | sort | uniq -c | sort -k2
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Friday > 25% of weekly commits | 🟠 HIGH | 10 |
| Last day of sprint > 40% of sprint commits | 🔴 CRITICAL | 15 |
| Even distribution across week | ✅ Healthy | 0 |

---

## Category 4: CI/CD Practice Indicators

### 4.1 Commit-to-Main Frequency / Deployment Frequency Proxy (Anti-pattern #23)

**Detection:**
```bash
# Weekly commits to main (last quarter)
git log main --since="3 months ago" --pretty=format:'%ad' --date=format:'%Y-W%V' | sort | uniq -c

# Per-developer daily commit rate to main
git log main --since="30 days ago" --pretty=format:'%an' | sort | uniq -c | awk '{print $2": "$1/30" commits/day"}'
```

**Severity:**

| Frequency | Severity | Weight | DORA Level |
|-----------|----------|--------|------------|
| Multiple daily | ✅ Elite | 0 | Elite |
| Daily | ✅ High | 0 | High |
| Several per week | 🟡 MEDIUM | 5 | Medium |
| Weekly | 🟠 HIGH | 15 | Medium |
| Monthly | 🔴 CRITICAL | 25 | Low |

---

### 4.2 Revert Frequency / Change Failure Rate Proxy (Anti-patterns #24–25)

**Detection:**
```bash
# Count reverts vs total
total=$(git log main --oneline --since="6 months ago" | wc -l)
reverts=$(git log main --grep="^Revert" --oneline --since="6 months ago" | wc -l)
rate=$(echo "scale=2; $reverts * 100 / $total" | bc)
echo "Revert rate: $rate% ($reverts of $total commits)"

# Recent reverts
git log main --grep="^Revert" --oneline --since="3 months ago"
```

**Severity:**

| Revert Rate | Severity | Weight |
|-------------|----------|--------|
| < 5% | ✅ Elite | 0 |
| 5–10% | 🟡 MEDIUM | 5 |
| 10–15% | 🟠 HIGH | 15 |
| 15–30% | 🔴 CRITICAL | 20 |
| > 30% | 🔴 SEVERE | 25 |

---

### 4.3 Hotfix/Emergency Pattern (Anti-pattern #26)

**Detection:**
```bash
# Hotfix branches
git branch -r | grep -iE 'hotfix|emergency|urgent|patch'

# Hotfix commits
git log --all --grep -iE 'hotfix|emergency|urgent|critical fix' --oneline --since="6 months ago" | wc -l
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| < 1 hotfix/month | ✅ Healthy | 0 |
| 1–2 hotfixes/month | 🟡 MEDIUM | 5 |
| 3–4 hotfixes/month | 🟠 HIGH | 10 |
| > 4 hotfixes/month | 🔴 CRITICAL | 20 |

---

### 4.4 Code Freeze Detection (Anti-pattern #27)

**Why**: DORA research: elite teams never have code freeze or stabilization periods.

**Detection:**
```bash
# Gaps > 7 days in commit activity
git log main --format='%ct' --since="1 year ago" | sort -n | awk '
  NR>1 && ($1-prev)>604800 {
    print strftime("%Y-%m-%d", prev) " to " strftime("%Y-%m-%d", $1) ": " int(($1-prev)/86400) " day gap"
  }
  {prev=$1}
'
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| No gaps > 7 days | ✅ Elite | 0 |
| Occasional gaps (holidays) | 🟡 MEDIUM | 5 |
| Regular planned freezes | 🔴 CRITICAL | 20 |

---

## Category 5: Collaboration Anti-Patterns

### 5.1 Knowledge Silos / Bus Factor (Anti-pattern #28)

**Why**: Files owned > 70% by a single author = critical knowledge concentration risk. Research: 65% of GitHub projects have bus factor ≤ 2.

**Detection:**
```bash
# Single-author files
git ls-files | while read file; do
  authors=$(git log --follow --format='%an' -- "$file" 2>/dev/null | sort -u | wc -l)
  [ "$authors" -eq 1 ] && echo "$file"
done | head -30

# Directory-level bus factor
find . -type d -maxdepth 2 | grep -v '.git' | while read dir; do
  authors=$(git log --format='%an' -- "$dir" 2>/dev/null | sort -u | wc -l)
  [ $authors -gt 0 ] && echo "$authors authors: $dir"
done | sort -n | head -20
```

**Severity:**

| Ownership | Severity | Weight |
|-----------|----------|--------|
| < 50% single author | ✅ Distributed | 0 |
| 50–70% | 🟡 MEDIUM | 5 |
| 70–90% | 🟠 HIGH | 10 |
| > 90% | 🔴 CRITICAL | 20 |
| > 20% of files bus factor=1 | 🔴 CRITICAL | 20 |

---

### 5.2 After-Hours/Weekend Commits / Burnout Signal (Anti-pattern #29)

**Why**: 83% of developers suffer burnout. Sustained after-hours patterns correlate with decreased quality and attrition.

**Detection:**
```bash
# Weekend commits
total=$(git log --since="6 months ago" --format='%ad' --date=format:'%u' | wc -l)
weekend=$(git log --since="6 months ago" --format='%ad' --date=format:'%u' | awk '$1>=6' | wc -l)
pct=$(echo "scale=1; $weekend * 100 / $total" | bc)
echo "Weekend commits: $pct% ($weekend of $total)"

# Late night commits (after 8pm, before 6am)
git log --since="6 months ago" --format='%an %ad' --date=format:'%H' | awk '($NF>=20 || $NF<6) {count[$1]++} END {for(a in count) print count[a], a}' | sort -rn
```

**Severity:**

| After-Hours % | Severity | Weight |
|---------------|----------|--------|
| < 10% | ✅ Normal | 0 |
| 10–20% | 🟡 MEDIUM | 5 |
| 20–30% | 🟠 HIGH | 10 |
| > 30% | 🔴 CRITICAL | 15 |

---

### 5.3 Lack of Code Review Signals (Anti-patterns #30–31)

**Detection:**
```bash
# Merge commit ratio (PRs create merges)
merges=$(git log main --merges --oneline --since="6 months ago" | wc -l)
total=$(git log main --oneline --since="6 months ago" | wc -l)
echo "Merges: $merges of $total commits ($(echo "scale=1; $merges*100/$total" | bc)%)"

# Direct pushes to main
git log main --no-merges --oneline --since="3 months ago" | wc -l

# Co-authored commits
git log --all --grep="Co-authored-by" --oneline --since="6 months ago" | wc -l
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| > 50% merges (PR workflow) | ✅ Healthy | 0 |
| < 20% merges | 🟠 HIGH | 15 |
| 0% merges | 🔴 CRITICAL | 20 |
| > 50% direct to main | 🟠 HIGH | 10 |

---

### 5.4 Pull Request Anti-Patterns (Anti-patterns #32–33)

**Detection:**
```bash
# Large merge commits (large PRs)
git log --merges --pretty=format:'%H %s' --since="6 months ago" | while read hash msg; do
  changes=$(git show --stat $hash 2>/dev/null | tail -1)
  insertions=$(echo "$changes" | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' | head -1)
  [ -n "$insertions" ] && [ "$insertions" -gt 400 ] && echo "LARGE PR ($insertions lines): $msg"
done | head -20

# Self-merged PRs
git log --merges --format='%H|%an|%cn' --since="6 months ago" | while IFS='|' read hash author committer; do
  pr_author=$(git log -1 --format='%an' ${hash}^2 2>/dev/null)
  [ "$pr_author" = "$committer" ] && echo "SELF-MERGE: $(git log -1 --format='%s' $hash)"
done | head -10
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| PRs averaging < 400 lines | ✅ Healthy | 0 |
| PRs averaging 400–800 lines | 🟡 MEDIUM | 5 |
| PRs averaging > 800 lines | 🟠 HIGH | 15 |
| > 20% self-merged PRs | 🟠 HIGH | 10 |
| PRs open > 7 days average | 🟠 HIGH | 10 |

---

### 5.5 Contributor Churn (Anti-pattern #34)

**Detection:**
```bash
# Contributor timeline
git shortlog -sn --all | head -20 | while read count author; do
  first=$(git log --author="$author" --format='%ad' --date=short --reverse | head -1)
  last=$(git log --author="$author" --format='%ad' --date=short | head -1)
  echo "$author: $first to $last ($count commits)"
done

# One-time contributors
git shortlog -sn --since="1 year ago" | awk '$1==1 {print}' | wc -l | xargs echo "Single-commit authors:"

# Contributors who left
git log --format='%an' --until="6 months ago" | sort -u > /tmp/old_a.txt
git log --format='%an' --since="6 months ago" | sort -u > /tmp/new_a.txt
comm -23 /tmp/old_a.txt /tmp/new_a.txt 2>/dev/null | head -10
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Stable contributor base | ✅ Healthy | 0 |
| > 30% one-time contributors | 🟡 MEDIUM | 5 |
| > 50% turnover in 12 months | 🟠 HIGH | 10 |

---

## Category 6: History Rewriting Anti-Patterns

### 6.1 Excessive Squash Merging (Anti-patterns #35)

**Why**: Squashing destroys bisect capability, loses attribution, breaks patch-id detection.

**Detection:**
```bash
# Large single commits with PR references
git log main --no-merges --format='%H %s' --since="6 months ago" | while read hash msg; do
  if echo "$msg" | grep -qE '#[0-9]+'; then
    lines=$(git show --shortstat $hash 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+')
    [ -n "$lines" ] && [ "$lines" -gt 300 ] && echo "$hash ($lines lines): $msg"
  fi
done | head -20

# Merge vs non-merge ratio
merges=$(git log main --merges --oneline --since="6 months ago" | wc -l)
non_merges=$(git log main --no-merges --oneline --since="6 months ago" | wc -l)
total=$((merges + non_merges))
echo "Merges: $merges ($(echo "scale=1; $merges * 100 / $total" | bc 2>/dev/null)%), Non-merges: $non_merges"
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Squash for cleanup (< 200 lines) | ✅ Appropriate | 0 |
| > 50% PRs squashed to > 300 lines | 🟡 MEDIUM | 5 |
| Mandatory squash policy (no exceptions) | 🟠 HIGH | 10 |
| > 80% PRs squashed to > 500 lines | 🔴 CRITICAL | 15 |
| Zero merge commits with PR workflow | 🟠 HIGH | 10 |

---

### 6.2 Force Push to Shared Branches (Anti-patterns #36–37)

**Why**: Force pushing rewrites public history. Others' branches diverge, requiring manual intervention.

**Detection:**
```bash
# Check reflog for force push evidence
git reflog show --all 2>/dev/null | grep -iE "forced-update|reset.*hard|rebase.*finished" | head -20

# Branches with potential history rewrites
git for-each-ref --format='%(refname:short)' refs/remotes/ | grep -v HEAD | while read branch; do
  gaps=$(git log --format='%ct' $branch 2>/dev/null | sort -n | awk 'NR>1 && ($1-prev)>604800 {count++} {prev=$1} END {print count+0}')
  [ "$gaps" -gt 3 ] && echo "$branch: $gaps suspicious timeline gaps"
done
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Force push to personal branch | ✅ Acceptable | 0 |
| Force push with --force-with-lease | 🟡 MEDIUM | 5 |
| Force push to shared branch | 🟠 HIGH | 15 |
| Force push to develop/release | 🔴 CRITICAL | 20 |
| Force push to main/master | 🔴 CRITICAL | 25 |

---

### 6.3 Rebase on Shared Branches (Anti-pattern #38)

**Detection:**
```bash
# Commits with author date != commit date (rebase indicator)
git log --all --format='%H %ai %ci' --since="3 months ago" | awk '{
  split($2,ad,"-"); split($5,cd,"-")
  aday = ad[1]*10000 + ad[2]*100 + ad[3]
  cday = cd[1]*10000 + cd[2]*100 + cd[3]
  if(cday - aday > 7) print $1 " authored " $2 " committed " $5
}' | head -10
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Rebase personal branch before PR | ✅ Best Practice | 0 |
| Rebase shared branch without coordination | 🟠 HIGH | 15 |
| Rebase after PR review started | 🟠 HIGH | 10 |
| Rebase main/develop | 🔴 CRITICAL | 25 |

---

### 6.4 Revert Chains (Anti-pattern #39)

**Detection:**
```bash
# Find revert chains
git log --all --grep="Revert" --oneline --since="6 months ago" | while read hash msg; do
  echo "$msg" | grep -qi "revert.*revert" && echo "REVERT CHAIN: $hash $msg"
done

# Rapid reverts (< 24 hours)
git log --all --grep="^Revert" --format='%H %s' --since="3 months ago" | while read hash msg; do
  original_hash=$(echo "$msg" | grep -oE '[a-f0-9]{7,40}' | head -1)
  if [ -n "$original_hash" ]; then
    original_date=$(git log -1 --format='%ct' $original_hash 2>/dev/null)
    revert_date=$(git log -1 --format='%ct' $hash 2>/dev/null)
    if [ -n "$original_date" ] && [ -n "$revert_date" ]; then
      hours=$(( (revert_date - original_date) / 3600 ))
      [ "$hours" -lt 24 ] && [ "$hours" -gt 0 ] && echo "Reverted in ${hours}h: $msg"
    fi
  fi
done | head -10
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Occasional revert (< 5%) | ✅ Normal | 0 |
| Revert within 24h | 🟡 MEDIUM | 5 |
| Revert of revert | 🟠 HIGH | 10 |
| > 3 revert chains in 3 months | 🔴 CRITICAL | 15 |
| Same feature reverted multiple times | 🔴 CRITICAL | 20 |

---

### 6.5 WIP/Fixup Commits on Shared Branches (Anti-patterns #40–41)

**Detection:**
```bash
# WIP commits on main
git log main --grep -iE '^WIP|^wip:|work in progress' --oneline --since="6 months ago" | head -20

# Orphaned fixup commits
git log main --grep -iE '^fixup!|^squash!' --oneline --since="6 months ago" | head -20

# "DO NOT MERGE" commits merged
git log main --grep -iE 'DO NOT MERGE' --oneline --since="6 months ago" | head -5
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| WIP on personal branch | ✅ Normal | 0 |
| WIP commits on main | 🟠 HIGH | 10 |
| Orphaned fixup! on main | 🟠 HIGH | 10 |
| > 5% of main commits are WIP/temp | 🔴 CRITICAL | 15 |
| "DO NOT MERGE" merged | 🔴 CRITICAL | 20 |

---

## Category 7: Code Quality Forensics

### 7.1 Churn Analysis / Defect Hotspots (Anti-pattern #42)

**Why**: Microsoft Research found relative churn predicts defects with 89% accuracy.

**Detection:**
```bash
# Top 20 most frequently modified files
git log --format=format: --name-only --since="6 months ago" | egrep -v '^$' | sort | uniq -c | sort -rn | head -20

# High churn + multiple authors
git log --format=format: --name-only --since="6 months ago" | egrep -v '^$' | sort | uniq -c | sort -rn | head -50 | while read count file; do
  [ $count -gt 10 ] && {
    authors=$(git log --format='%an' -- "$file" 2>/dev/null | sort -u | wc -l)
    [ $authors -gt 2 ] && echo "$count changes, $authors authors: $file"
  }
done
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Hotspot > 20 changes/month | 🟠 HIGH | 10 |
| Hotspot > 50 changes/month | 🔴 CRITICAL | 15 |
| > 10% of files are hotspots | 🟠 HIGH | 10 |

---

### 7.2 Temporal Coupling / Hidden Dependencies (Anti-pattern #44)

**Detection:**
```bash
# Files changing together frequently
git log --name-only --pretty=format:'COMMIT' --since="6 months ago" | awk '
  /^COMMIT$/ {
    for(i in files)
      for(j in files)
        if(i<j) pairs[i","j]++
    delete files
    next
  }
  NF>0 && !/^COMMIT$/ { files[$0]=1 }
  END {
    for(p in pairs)
      if(pairs[p]>5) print pairs[p], p
  }
' | sort -rn | head -20
```

**Severity:**

| Coupling | Severity | Weight |
|----------|----------|--------|
| Expected coupling (same module) | ✅ Normal | 0 |
| > 50% coupling between unrelated files | 🟠 HIGH | 10 |
| > 10 unexpected couplings | 🔴 CRITICAL | 15 |

---

### 7.3 Fix Commit Patterns (Anti-pattern #43)

**Detection:**
```bash
# Fix commit ratio
fixes=$(git log --all --grep -iE '^fix|bug|patch|repair' --oneline --since="6 months ago" | wc -l)
total=$(git log --all --oneline --no-merges --since="6 months ago" | wc -l)
pct=$(echo "scale=1; $fixes * 100 / $total" | bc)
echo "Fix commits: $pct% ($fixes of $total)"
```

**Severity:**

| Fix Ratio | Severity | Weight |
|-----------|----------|--------|
| < 20% | ✅ Normal | 0 |
| 20–30% | 🟡 MEDIUM | 5 |
| 30–50% | 🟠 HIGH | 10 |
| > 50% | 🔴 CRITICAL | 15 |

---

### 7.4 Testing Pattern Analysis (Anti-patterns #45–47)

**Detection:**
```bash
# Test vs production change ratio
test_changes=$(git log --format=format: --name-only --since="6 months ago" | grep -ciE 'test|spec|_test\.|\.test\.|tests/')
prod_changes=$(git log --format=format: --name-only --since="6 months ago" | grep -cviE 'test|spec|_test\.|\.test\.|tests/|node_modules|vendor')
ratio=$(echo "scale=2; $test_changes * 100 / $prod_changes" | bc)
echo "Test changes: $test_changes, Production: $prod_changes, Ratio: $ratio%"

# Commits including tests
total_commits=$(git log --oneline --since="6 months ago" | wc -l)
echo "Total commits: $total_commits"

# Test code growth
git log --numstat --since="6 months ago" -- '*test*' '*spec*' 2>/dev/null | awk '
  /^[0-9]+/ { adds+=$1; dels+=$2 }
  END { print "Test code: +" adds+0 " -" dels+0 " (net: " adds-dels ")" }
'
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Test/production ratio > 30% | ✅ Healthy | 0 |
| Test/production ratio 15–30% | 🟡 MEDIUM | 5 |
| Test/production ratio < 15% | 🟠 HIGH | 10 |
| < 20% of commits include tests | 🟠 HIGH | 10 |
| Negative net test code growth | 🔴 CRITICAL | 15 |

---

## Category 8: Release Pattern Analysis

### 8.1 Release Cadence (Anti-patterns #48–49)

**Detection:**
```bash
# Time between releases
git for-each-ref --sort=creatordate --format='%(creatordate:unix) %(refname:short)' refs/tags/ | awk '
  NR>1 {days=($1-prev)/86400; print prev_tag " -> " $2 ": " int(days) " days"}
  {prev=$1; prev_tag=$2}
' | tail -20

# Average release interval
git for-each-ref --sort=creatordate --format='%(creatordate:unix)' refs/tags/ | awk '
  NR>1 {total+=$1-prev; count++}
  {prev=$1}
  END {if(count>0) print "Average: " total/count/86400 " days"}
'
```

**Severity:**

| Cadence | Severity | Weight | DORA |
|---------|----------|--------|------|
| On-demand/daily | ✅ Elite | 0 | Elite |
| Weekly | ✅ High | 0 | High |
| Monthly | 🟠 HIGH | 10 | Medium |
| Quarterly | 🔴 CRITICAL | 20 | Low |

---

### 8.2 Tag/Versioning Anti-Patterns (Anti-patterns #50–51)

**Detection:**
```bash
# Tag naming consistency
git tag | head -50 | awk '
  /^v[0-9]/ { v_prefix++ }
  /^[0-9]/ { no_prefix++ }
  { total++ }
  END { print "v-prefixed:", v_prefix+0, "No prefix:", no_prefix+0, "Total:", total+0 }
'

# Semantic versioning compliance
semver=$(git tag | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+' | wc -l)
total=$(git tag | wc -l)
echo "SemVer compliant: $semver of $total tags"

# No tags in > 90 days
last_tag_date=$(git for-each-ref --sort=-creatordate --format='%(creatordate:unix)' refs/tags/ | head -1)
days_since=$(( ($(date +%s) - ${last_tag_date:-0}) / 86400 ))
echo "Days since last tag: $days_since"
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Consistent semantic versioning | ✅ Healthy | 0 |
| Mixed tag naming | 🟡 MEDIUM | 5 |
| No tags in > 90 days | 🟠 HIGH | 10 |
| No tags at all | 🔴 CRITICAL | 15 |

---

## Category 9: Repository Health Anti-Patterns

### 9.1 Large Binary Files (Anti-patterns #52–54)

**Detection:**
```bash
# Repository size
du -sh .git
git count-objects -vH

# Large files
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort -rnk2 | head -20 | while read hash size path; do
  [ $size -gt 1000000 ] && echo "$(($size/1024/1024))MB: $path"
done

# Binary files not in LFS
git ls-files | while read file; do
  file "$file" 2>/dev/null | grep -qE 'binary|image|video|audio' && echo "$file"
done | head -20
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Repo < 100MB | ✅ Healthy | 0 |
| Repo 100MB–500MB | 🟡 MEDIUM | 5 |
| Repo 500MB–1GB | 🟠 HIGH | 10 |
| Repo > 1GB | 🔴 CRITICAL | 15 |
| Binary files > 10MB not in LFS | 🟠 HIGH | 10 |

---

### 9.2 Secrets / Sensitive Data (Anti-patterns #55–57)

**CRITICAL: Any secrets finding requires immediate credential rotation.**

**Detection:**
```bash
# Common secret patterns
git grep -E -i '(api[_-]?key|secret[_-]?key|password|passwd|token|auth[_-]?token|private[_-]?key)[\s]*[=:][\s]*["\047]?[A-Za-z0-9/+=]{16,}' -- ':!*.lock' ':!package-lock.json' 2>/dev/null | head -20

# AWS keys
git grep -E 'AKIA[0-9A-Z]{16}' 2>/dev/null

# GitHub tokens
git grep -E 'gh[pousr]_[A-Za-z0-9]{36}' 2>/dev/null

# Private keys
git grep -l 'BEGIN.*PRIVATE KEY' 2>/dev/null
git ls-files | grep -iE '\.(pem|key|p12|pfx|ppk)$'

# Env files
git ls-files | grep -iE '^\.env$|\.env\.|\.env-|env\.local|\.secrets'

# Database connection strings
git grep -E '(mysql|postgres|mongodb|redis)://[^@]+@' 2>/dev/null | head -5

# Commits removing secrets (indicates prior leak)
git log --all --oneline --grep='remove.*key\|remove.*secret\|remove.*password' | head -10
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| No secrets detected | ✅ Healthy | 0 |
| .env files committed | 🟠 HIGH | 15 |
| API keys detected | 🔴 CRITICAL | 25 |
| Private keys detected | 🔴 CRITICAL | 25 |
| AWS/cloud credentials | 🔴 CRITICAL | 25 |
| Database connection strings | 🔴 CRITICAL | 25 |
| History of "removed secret" commits | 🟠 HIGH | 15 |

---

### 9.3 Vendor/Dependency Anti-Patterns (Anti-patterns #58–59)

**Detection:**
```bash
# Committed dependency directories
git ls-files | grep -E '^node_modules/|^vendor/|^packages/|^bower_components/|^deps/|^third_party/' | head -5
git ls-files | grep -cE '^node_modules/|^vendor/|^packages/|^bower_components/' | xargs echo "Total vendor files:"
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| No vendor dirs in git | ✅ Healthy | 0 |
| node_modules committed | 🔴 CRITICAL | 20 |
| vendor/ committed (when pkg mgr exists) | 🟠 HIGH | 15 |
| Vendored code modified locally | 🔴 CRITICAL | 20 |

---

### 9.4 Submodule Anti-Patterns (Anti-patterns #60–62)

**Detection:**
```bash
# Check for submodules
if [ -f .gitmodules ]; then
  echo "Submodules found:"
  git config --file .gitmodules --get-regexp path | awk '{print $2}'
  echo "Total: $(git config --file .gitmodules --get-regexp path | wc -l)"
  # Check for nested submodules
  find . -name .gitmodules -not -path './.gitmodules' 2>/dev/null
  # Submodule status
  git submodule status 2>/dev/null
else
  echo "No submodules"
fi
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| 0 submodules | ✅ Ideal | 0 |
| 1–2 justified submodules | 🟢 LOW | 3 |
| 3–5 submodules | 🟡 MEDIUM | 5 |
| > 5 submodules | 🟠 HIGH | 10 |
| Nested submodules | 🔴 CRITICAL | 15 |
| Submodules out of sync | 🟠 HIGH | 10 |

---

### 9.5 Authorship/Identity Issues (Anti-patterns #63–64)

**Detection:**
```bash
# Suspicious emails
git log --all --format='%ae' --since="1 year ago" | sort -u | grep -iE 'example\.com|localhost|noreply|root@|admin@'

# Multiple emails per author
git log --all --format='%an|%ae' --since="1 year ago" | sort -u | awk -F'|' '
  { if(name[$1] && name[$1] != $2) print $1 ": " name[$1] " AND " $2; name[$1] = $2 }
'

# Generic author names
git log --all --format='%an' --since="1 year ago" | sort -u | grep -iE '^(root|admin|user|test|unknown)$'
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Consistent author info | ✅ Healthy | 0 |
| Multiple emails per author (> 2) | 🟡 MEDIUM | 5 |
| Generic/placeholder names | 🟠 HIGH | 10 |

---

### 9.6 Monorepo Scale (Anti-patterns #65–67)

**Detection:**
```bash
# Scale metrics
echo "Total files: $(git ls-files | wc -l)"
echo "Total commits: $(git rev-list --count HEAD 2>/dev/null || git log --oneline | wc -l)"
echo "Total branches: $(git branch -r | wc -l)"
echo "Total tags: $(git tag | wc -l)"

# git status timing
time git status >/dev/null 2>&1

# Independent project markers
find . -maxdepth 3 -name 'package.json' -o -name 'go.mod' -o -name 'pom.xml' -o -name 'Cargo.toml' 2>/dev/null | wc -l
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| < 10,000 files | ✅ Manageable | 0 |
| 10,000–50,000 files | 🟡 MEDIUM | 5 |
| 50,000–200,000 files | 🟠 HIGH | 10 |
| > 200,000 files | 🔴 CRITICAL | 15 |
| git status > 5 seconds | 🟠 HIGH | 10 |

---

## Category 10: Commit Message Quality

### 10.1 Message Content Anti-Patterns (Anti-patterns #68–71)

**The Seven Rules (Chris Beams):**
1. Separate subject from body with blank line
2. Limit subject to 50 characters
3. Capitalize the subject line
4. Do not end subject with period
5. Use imperative mood
6. Wrap body at 72 characters
7. Use body to explain what and why

**Detection:**
```bash
# Subject lines > 72 characters
git log --format='%s' --since="6 months ago" | awk 'length > 72 {count++} END {print count+0 " subjects > 72 chars"}'

# Past tense (should be imperative)
git log --format='%s' --since="6 months ago" | grep -ciE '^(added|fixed|updated|changed|removed|deleted|created|implemented)' | xargs echo "Past tense messages:"

# Ticket-only messages
git log --format='%s' --since="6 months ago" | grep -cE '^[A-Z]+-[0-9]+$|^#[0-9]+$' | xargs echo "Ticket-only messages:"

# Generic useless messages
git log --format='%s' --since="6 months ago" | grep -ciE '^(fix|update|change|modify|refactor|cleanup|misc|stuff|things|wip|test)$' | xargs echo "Generic messages:"

# Large changes without body
git log --format='%H %s%n%b---' --since="3 months ago" | awk '
  /^[a-f0-9]{40}/ { hash=$1; subject=substr($0,42) }
  /^---$/ { if(hash && !body) no_body++; body=0; hash="" }
  /./ && !/^[a-f0-9]{40}/ && !/^---$/ { body=1 }
  END { print no_body+0 " commits without body" }
'
```

**Severity:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Follows conventional commits | ✅ Elite | 0 |
| > 20% subjects > 72 chars | 🟡 MEDIUM | 5 |
| > 10% generic/useless messages | 🟠 HIGH | 10 |
| > 5% ticket-only messages | 🟠 HIGH | 10 |
| Large changes without body | 🟠 HIGH | 10 |

---

## Score Interpretation

Sum all detected anti-pattern weights for the total score.

| Score Range | Assessment | DORA Equivalent | Recommendation |
|-------------|------------|-----------------|----------------|
| 0–75 | Elite | Elite | Minor optimization opportunities |
| 76–150 | High Performer | High | Specific improvement areas |
| 151–300 | Medium Performer | Medium | Systematic process issues |
| 301–500 | Low Performer | Low | Significant transformation needed |
| > 500 | Crisis | Below Low | Fundamental rebuild required |

**Maximum possible score: ~900+ points** (if all 71 anti-patterns are at maximum severity).

---

## Priority Remediation Order

Based on DORA research impact:

1. **Immediate (Week 1)**: Secrets in repo, force push to main, code freeze, node_modules committed
2. **Urgent (Sprint 1)**: Long-lived branches, branch-per-environment, cherry-pick promotion
3. **High (Sprint 2–3)**: Large commits, low commit frequency, bus factor issues, squash abuse
4. **Medium (Month 1–2)**: Poor messages, submodule complexity, GitFlow overhead
5. **Ongoing**: Churn hotspots, after-hours patterns, tag consistency, test coverage

---

## Output Format

```markdown
## Git Health Audit Report

### Summary
- **Repository**: [name]
- **Analysis Period**: Last 6 months
- **Total Score**: [X] / 900 max
- **Assessment**: [Elite / High / Medium / Low / Crisis]
- **Anti-Patterns Detected**: [count] of 71

### Category Scores

| Category | Anti-Patterns Found | Score | Worst Finding |
|----------|-------------------|-------|---------------|
| 1. Branching | X of 11 | X | [description] |
| 2. Cherry-Picking & Merge | X of 4 | X | [description] |
| 3. Commit Hygiene | X of 7 | X | [description] |
| 4. CI/CD Indicators | X of 5 | X | [description] |
| 5. Collaboration | X of 7 | X | [description] |
| 6. History Rewriting | X of 7 | X | [description] |
| 7. Code Quality Forensics | X of 6 | X | [description] |
| 8. Release Patterns | X of 4 | X | [description] |
| 9. Repository Health | X of 16 | X | [description] |
| 10. Commit Messages | X of 4 | X | [description] |
| **Total** | **X of 71** | **X** | |

### Critical Findings (Immediate Action)
[List all 🔴 CRITICAL findings with evidence and remediation steps]

### High Priority Findings
[List all 🟠 HIGH findings]

### Detailed Findings by Category
[Full findings for each category with detection command output and evidence]

### DORA Metrics Estimate

| Metric | Estimated Level | Evidence |
|--------|----------------|----------|
| Deployment Frequency | Elite/High/Medium/Low | [from tag/commit frequency] |
| Lead Time for Changes | Elite/High/Medium/Low | [from branch lifespan] |
| Change Failure Rate | Elite/High/Medium/Low | [from revert rate] |
| MTTR | Elite/High/Medium/Low | [from hotfix patterns] |

### Remediation Roadmap
[Prioritized list of fixes ordered by DORA impact]
```

---

## References

- Forsgren, N., Humble, J., Kim, G. (2018). *Accelerate*
- DORA State of DevOps Reports (2014–2024)
- Fowler, M. "Continuous Integration" — martinfowler.com
- Finster, B. et al. "Minimum CD" — minimumcd.org
- Tornhill, A. (2015). *Your Code as a Crime Scene*
- Chen, R. "Stop cherry-picking, start merging" — Microsoft DevBlogs
- Stocker, G. "Please stop recommending Git Flow!"
- Beams, C. "How to Write a Git Commit Message"
