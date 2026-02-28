# Git Anti-Patterns Audit Framework
## Detecting Software Delivery Problems Through Repository Analysis

**Version 3.0 — Comprehensive Edition (71 Anti-Patterns)**

Git repositories contain a forensic record of delivery practices, revealing whether organizations follow elite patterns or struggle with integration debt, quality issues, and unsustainable work. This framework provides specific git commands, evidence-based thresholds, and severity rankings derived from DORA research and CD practitioner wisdom.

The core insight from a decade of DORA research: teams with short-lived branches (under 24 hours), daily commits to trunk, and small batch sizes consistently outperform those practicing feature branching—by margins of 182x faster deployment frequency and 127x faster lead times.

**What's covered in this framework:**
1. Branching anti-patterns (long-lived branches, environment branches, GitFlow misuse)
2. Cherry-picking and merge strategy anti-patterns (squash abuse, bisect destruction)
3. Commit hygiene (oversized commits, poor messages, batching patterns)
4. CI/CD indicators (revert rates, hotfix frequency, code freezes)
5. Collaboration signals (bus factor, after-hours work, code review bypass)
6. History rewriting dangers (force push, rebase abuse, WIP commits)
7. Code quality forensics (churn hotspots, fix ratios, temporal coupling, testing patterns)
8. Release patterns (cadence, tagging, versioning)
9. Repository health (size, secrets, dependencies, submodules, monorepo scale)
10. Commit message standards

---

## Severity Scoring System

| Level | Weight | Description |
|-------|--------|-------------|
| 🔴 CRITICAL | 20-25 | Blocks elite performance; immediate action required |
| 🟠 HIGH | 10-15 | Significant impediment to delivery; address within sprint |
| 🟡 MEDIUM | 5-10 | Suboptimal practice; schedule improvement work |
| 🟢 LOW | 1-5 | Minor issue; address opportunistically |

---

## 1. BRANCHING ANTI-PATTERNS

### 1.1 Long-Lived Feature Branches

**Why it matters:** Martin Fowler's CI definition requires integration at least daily. Bryan Finster's Minimum CD principles state branches should be short-lived (<24 hours). Long-lived branches create merge complexity, integration debt, and delayed feedback.

**Detection commands:**

```bash
# List all branches with age calculation
git for-each-ref --format='%(refname:short) %(committerdate:relative)' refs/heads/ refs/remotes/

# Calculate exact age in days for each branch
git for-each-ref --format='%(refname:short) %(committerdate:unix)' refs/remotes/ | while read branch timestamp; do
  days=$(( ($(date +%s) - $timestamp) / 86400 ))
  echo "$branch: $days days old"
done | sort -t: -k2 -rn

# Find branches not merged to main
git branch -r --no-merged origin/main

# Calculate divergence (commits ahead/behind) for all branches
git for-each-ref --format='%(refname:short)' refs/remotes/ | grep -v HEAD | while read branch; do
  ahead=$(git rev-list --count origin/main..$branch 2>/dev/null || echo 0)
  behind=$(git rev-list --count $branch..origin/main 2>/dev/null || echo 0)
  [ $ahead -gt 0 ] && echo "$branch: ahead=$ahead, behind=$behind"
done | sort -t= -k2 -rn
```

**Severity thresholds:**

| Branch Age | Severity | Weight | DORA Impact |
|------------|----------|--------|-------------|
| <1 day | ✅ Elite | 0 | Enables continuous integration |
| 1-3 days | 🟡 MEDIUM | 5 | Acceptable but limits daily deployment |
| 3-7 days | 🟠 HIGH | 15 | 50%+ merge conflict probability |
| >7 days | 🔴 CRITICAL | 25 | Blocks elite performance |
| >30 days | 🔴 SEVERE | 25 | Integration failure guaranteed |

---

### 1.2 Branch-Per-Environment

**Why it matters:** Codefresh states unequivocally: "Using Git branches for modeling different environments is an anti-pattern." This violates the "build once, deploy everywhere" principle. Each environment rebuild creates different binaries, invalidating testing.

**Detection commands:**

```bash
# Detect environment-named branches
git branch -r | grep -iE '(dev|develop|staging|stage|uat|qa|test|preprod|pre-prod|production|prod)$'

# Check if environment branches are divergent from main
for branch in dev develop staging uat qa production prod; do
  if git rev-parse --verify origin/$branch &>/dev/null; then
    ahead=$(git rev-list --count origin/main..origin/$branch 2>/dev/null || echo "N/A")
    behind=$(git rev-list --count origin/$branch..origin/main 2>/dev/null || echo "N/A")
    echo "$branch: ahead=$ahead, behind=$behind"
  fi
done

# Check for unique commits in environment branches (not in main)
for branch in dev staging uat production; do
  if git rev-parse --verify origin/$branch &>/dev/null; then
    unique=$(git log origin/$branch --not origin/main --oneline 2>/dev/null | wc -l)
    [ $unique -gt 0 ] && echo "WARNING: $branch has $unique commits not in main"
  fi
done
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Environment branches exist but identical to main | 🟢 LOW | 5 |
| Environment branches with unique commits | 🟠 HIGH | 15 |
| Cherry-picks between environment branches | 🔴 CRITICAL | 25 |
| Hotfixes applied directly to prod branch | 🔴 CRITICAL | 25 |
| >10 commits divergence between env branches | 🔴 CRITICAL | 25 |

---

### 1.3 Big Bang Merges

**Why it matters:** Large merges indicate batch accumulation—the opposite of continuous flow. They create integration nightmares and hide defects.

**Detection commands:**

```bash
# Find large merge commits
git log --merges --pretty=format:'%H %s' --since="6 months ago" | while read hash msg; do
  files=$(git diff --name-only $hash^..$hash 2>/dev/null | wc -l)
  if [ "$files" -gt 50 ]; then
    echo "BIG BANG: $hash ($files files) - $msg"
  fi
done

# Analyze merge size distribution
git log --merges --pretty=format:'%H' --since="6 months ago" | while read hash; do
  git diff --shortstat $hash^..$hash 2>/dev/null
done | awk '/files? changed/ {total+=$1; count++} END {print "Avg files per merge:", total/count}'
```

**Severity thresholds:**

| Merge Size | Severity | Weight |
|------------|----------|--------|
| <20 files | ✅ Normal | 0 |
| 20-50 files | 🟡 MEDIUM | 5 |
| 50-100 files | 🟠 HIGH | 15 |
| >100 files | 🔴 CRITICAL | 20 |

---

### 1.4 Stale/Abandoned Branches

**Why it matters:** Stale branches clutter the repository, slow git operations, and create confusion about what's active.

**Detection commands:**

```bash
# Find stale remote branches (no commits in 90+ days)
git for-each-ref --sort=committerdate --format='%(committerdate:relative) %(refname:short)' refs/remotes/ | head -50

# Count total branches
echo "Total remote branches: $(git branch -r | wc -l)"

# Find merged but not deleted branches
git branch -r --merged origin/main | grep -v main | grep -v HEAD

# Branches with tracking gone (deleted on remote)
git branch -vv | grep ': gone]'
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| >50 remote branches | 🟡 MEDIUM | 5 |
| >100 remote branches | 🟠 HIGH | 10 |
| >20 branches stale >90 days | 🟠 HIGH | 10 |
| Merged but undeleted branches >50% | 🟡 MEDIUM | 5 |

---

### 1.5 GitFlow Misuse

**Why it matters:** Thoughtworks placed "Long-lived branches with Gitflow" on their Technology Radar as a pattern to avoid. GitFlow was designed for packaged software with scheduled releases, not web applications with continuous deployment. George Stocker argues that GitFlow's overhead "isn't good for you" if releasing multiple times daily. The develop branch creates a perpetual merge target that delays integration.

**Detection commands:**

```bash
# Detect GitFlow structure (develop branch exists)
git branch -r | grep -E 'origin/develop$' && echo "GitFlow detected: develop branch exists"

# Check if develop branch is divergent from main
if git rev-parse --verify origin/develop &>/dev/null; then
  ahead=$(git rev-list --count origin/main..origin/develop 2>/dev/null || echo 0)
  behind=$(git rev-list --count origin/develop..origin/main 2>/dev/null || echo 0)
  echo "develop vs main: ahead=$ahead, behind=$behind"
fi

# Find release branches (GitFlow pattern)
git branch -r | grep -iE 'release[/-]' | while read branch; do
  age_days=$(( ($(date +%s) - $(git log -1 --format='%ct' $branch)) / 86400 ))
  echo "$branch: $age_days days old"
done

# Detect hotfix branches and their frequency
git branch -r | grep -iE 'hotfix[/-]' | wc -l | xargs echo "Hotfix branches:"

# Check for feature branches older than 1 week (GitFlow often encourages long-lived features)
git for-each-ref --format='%(refname:short) %(committerdate:unix)' refs/remotes/ | 
  grep -iE 'feature[/-]' | while read branch timestamp; do
    days=$(( ($(date +%s) - $timestamp) / 86400 ))
    [ $days -gt 7 ] && echo "STALE FEATURE: $branch ($days days)"
  done
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| GitFlow structure with frequent integration (<daily) | ✅ Acceptable | 0 |
| GitFlow with develop >5 commits ahead of main | 🟡 MEDIUM | 10 |
| GitFlow with feature branches >7 days | 🟠 HIGH | 15 |
| GitFlow with release branches >14 days | 🟠 HIGH | 15 |
| GitFlow with >3 hotfix branches/month | 🔴 CRITICAL | 20 |
| GitFlow on web application with CD aspirations | 🟠 HIGH | 15 |

**Why GitFlow fails for modern web development:**

1. The develop branch creates a "staging area" that delays integration to trunk
2. Release branches encourage batching rather than continuous flow
3. Hotfix branches require parallel maintenance and cherry-picks
4. The ceremony overhead discourages small, frequent commits
5. Feature branches are expected to be long-lived by design

---

## 2. CHERRY-PICKING ANTI-PATTERNS

### 2.1 Cherry-Pick as Promotion Strategy

**Why it matters:** Cherry-picking creates duplicate commits with different SHAs, breaking git's ability to detect equivalent changes. It violates "same artifact" principle—what you tested isn't what you deploy. Microsoft's Raymond Chen documented how cherry-picks create "time bombs" in merge history.

**Detection commands:**

```bash
# Find commits with cherry-pick annotation (when -x flag was used)
git log --all --grep="cherry picked from commit" --oneline | wc -l

# Find potential cherry-picks by duplicate commit messages
git log --all --format='%s' | sort | uniq -d | while read msg; do
  count=$(git log --all --oneline --grep="$msg" --fixed-strings 2>/dev/null | wc -l)
  [ $count -gt 1 ] && echo "DUPLICATE ($count): $msg"
done | head -20

# Use git cherry to find commits not upstream
git cherry -v main origin/feature-branch 2>/dev/null | grep '^+'

# Find duplicate patches (same content, different SHA)
git log --all --format='%H' --since="6 months ago" | while read hash; do
  patch_id=$(git show $hash 2>/dev/null | git patch-id --stable 2>/dev/null | cut -d' ' -f1)
  [ -n "$patch_id" ] && echo "$patch_id $hash"
done | sort | uniq -D -w40 | head -20
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Occasional hotfix backport (<5/quarter) | 🟡 MEDIUM | 5 |
| Regular cherry-picks (5-20/quarter) | 🟠 HIGH | 15 |
| Cherry-picks to promote through environments | 🔴 CRITICAL | 20 |
| >20 duplicate commits detected | 🔴 CRITICAL | 20 |

---

### 2.2 Squash-Merge Abuse (Bisect Destruction)

**Why it matters:** Jake Worth notes: "For bisect to be useful, you must be committing atomically. If your practice is to squash-merge PRs, a bisect may only tell you that something broke when you merged in a huge PR." Mandatory squash-merging destroys git's most powerful debugging tool by consolidating potentially hundreds of commits into single opaque merge commits. The bisect algorithm's O(log n) efficiency becomes meaningless when each "commit" represents days or weeks of work.

**Detection commands:**

```bash
# Find squash-merge commits (large commits that are not merge commits)
git log --no-merges --pretty=format:'%H' --since="6 months ago" | while read hash; do
  lines=$(git show --stat $hash 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+')
  files=$(git show --stat $hash 2>/dev/null | tail -1 | grep -oE '[0-9]+ files?' | grep -oE '[0-9]+')
  [ -n "$lines" ] && [ "$lines" -gt 500 ] && echo "SQUASH SUSPECT: $hash ($lines insertions, $files files)"
done | head -20

# Detect squash pattern: non-merge commits with PR/MR references
git log --no-merges --oneline --since="6 months ago" | grep -iE '(#[0-9]+|![0-9]+|PR|MR)' | head -20

# Calculate squash vs merge ratio
merges=$(git log --merges --oneline --since="6 months ago" | wc -l)
non_merges=$(git log --no-merges --oneline --since="6 months ago" | wc -l)
echo "Merge commits: $merges, Non-merge commits: $non_merges"

# Estimate bisect effectiveness (commits per day average)
total=$(git log --oneline --since="6 months ago" | wc -l)
echo "Avg commits/day: $(echo "scale=1; $total / 180" | bc)"

# Find commits that span multiple logical changes (multiple file types)
git log --no-merges --pretty=format:'%H|%s' --numstat --since="3 months ago" | awk -F'|' '
  /^[a-f0-9]{40}\|/ { if(length(types)>3) print types, hash, msg; hash=$1; msg=$2; types="" }
  /\.(js|ts|py|go|java|rb|css|html|sql|yml)$/ { 
    ext=$NF; gsub(/.*\./, "", ext)
    if(index(types,ext)==0) types=types ext " "
  }
' | head -10
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Squash merges with commits <200 lines | ✅ Acceptable | 0 |
| Squash merges consistently >500 lines | 🟠 HIGH | 15 |
| Squash merges consistently >1000 lines | 🔴 CRITICAL | 20 |
| <1 commit per day average (severe squashing) | 🟠 HIGH | 15 |
| Squash + no PR commit history preserved | 🔴 CRITICAL | 20 |

**Impact on debugging:**

Bisect on a repository with atomic commits containing 1,000 commits between good and bad states requires approximately 10 iterations (log₂ 1000 ≈ 10) to find the exact breaking commit. With aggressive squash-merging reducing to 50 squashed commits, bisect finds the 50-commit squash but not the individual change—requiring manual review of potentially hundreds of lines.

---

### 2.3 Rebase-Only Workflows (Merge Context Loss)

**Why it matters:** While rebasing creates clean linear history, mandatory rebase-only policies destroy merge context that records when and how branches were integrated. The merge commit preserves the decision point—useful for understanding "why did we integrate X at this time?" In complex projects with multiple integration points, this context becomes valuable for forensic analysis.

**Detection commands:**

```bash
# Check merge commit ratio (very low indicates rebase-only)
total=$(git log --oneline --since="6 months ago" | wc -l)
merges=$(git log --merges --oneline --since="6 months ago" | wc -l)
ratio=$(echo "scale=2; $merges * 100 / $total" | bc)
echo "Merge commit ratio: $ratio% ($merges of $total)"

# Detect if history is purely linear (no branch evidence)
branches_visible=$(git log --graph --oneline --since="3 months ago" | grep -c '|')
echo "Graph complexity (branch points visible): $branches_visible"

# Find rebased commits (author date != commit date significantly different)
git log --format='%H %ad %cd' --date=unix --since="3 months ago" | while read hash ad cd; do
  diff=$((cd - ad))
  [ $diff -gt 86400 ] && echo "REBASED >1 day: $hash (author=$(date -d @$ad +%Y-%m-%d) commit=$(date -d @$cd +%Y-%m-%d))"
done | head -10

# Check for force push evidence (reflog if available locally)
git reflog --date=short | grep -E 'forced-update|reset' | head -10
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Rebase for local cleanup before merge | ✅ Best Practice | 0 |
| <5% merge commits in active repo | 🟡 MEDIUM | 5 |
| No merge commits at all (pure rebase) | 🟡 MEDIUM | 10 |
| Rebase-only + complex multi-team project | 🟠 HIGH | 15 |

**Note:** Rebase-only workflows are not inherently bad and many teams use them successfully. The severity depends on project complexity and whether the loss of merge context causes forensic difficulties.

---

## 3. COMMIT HYGIENE ANTI-PATTERNS

### 3.1 Oversized Commits

**Why it matters:** Research from Google and Microsoft shows PRs over 400 lines receive diminishing review quality. Large commits hide defects, complicate bisect, and increase change failure rate.

**Detection commands:**

```bash
# Find largest commits by lines changed
git log --pretty=tformat:'%H %s' --numstat --since="6 months ago" | awk '
  /^[a-f0-9]{40}/ { if(adds+dels>0) print adds+dels, commit, msg; commit=$1; msg=substr($0,42); adds=0; dels=0 }
  /^[0-9]+/ { adds+=$1; dels+=$2 }
  END { if(adds+dels>0) print adds+dels, commit, msg }
' | sort -rn | head -20

# Commits exceeding thresholds
git log --shortstat --pretty=format:'%h|%an|%s' --since="6 months ago" | awk -F'|' '
  /^[a-f0-9]+\|/ {hash=$1; author=$2; msg=$3}
  /files? changed/ {
    match($0, /([0-9]+) insertion/, ins)
    match($0, /([0-9]+) deletion/, del)
    total = ins[1] + del[1]
    if(total > 500) print hash, author, total, "lines:", msg
  }
' | head -20

# Distribution of commit sizes
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
  END {print "Small(<50):", small, "Medium(50-200):", medium, "Large(200-500):", large, "XL(>500):", xlarge}
'
```

**Severity thresholds:**

| Commit Size | Severity | Weight |
|-------------|----------|--------|
| <50 lines | ✅ Optimal | 0 |
| 50-200 lines | ✅ Good | 0 |
| 200-500 lines | 🟡 MEDIUM | 5 |
| 500-1000 lines | 🟠 HIGH | 10 |
| >1000 lines | 🔴 CRITICAL | 20 |

---

### 3.2 Infrequent Commits

**Why it matters:** Kent Beck defined CI as integrating "several times a day." Jez Humble's CI test: "Do all developers commit to mainline at least once a day?" If no, you're not doing CI.

**Detection commands:**

```bash
# Commit frequency per developer (last 90 days)
git shortlog -sn --since="90 days ago" --no-merges | while read count author; do
  days=90
  freq=$(echo "scale=2; $count / $days" | bc)
  echo "$author: $freq commits/day ($count total)"
done

# Days between commits per author (detect gaps)
git log --pretty=format:'%an|%ad' --date=short --since="90 days ago" | sort | awk -F'|' '
  {
    if($1 == prev_author && $2 != prev_date) {
      # Calculate day difference (simplified)
      gap++
    }
    prev_author=$1; prev_date=$2
  }
'

# Identify developers with <1 commit/day average
git shortlog -sn --since="30 days ago" --no-merges | awk '$1 < 20 {print "LOW FREQUENCY:", $0}'
```

**Severity thresholds:**

| Frequency | Severity | Weight |
|-----------|----------|--------|
| Multiple daily | ✅ Elite | 0 |
| Daily | ✅ Acceptable | 0 |
| Every 2-3 days | 🟠 HIGH | 10 |
| Weekly or less | 🔴 CRITICAL | 20 |

---

### 3.3 Poor Commit Messages

**Why it matters:** Commit messages are documentation. Poor messages make debugging, auditing, and understanding change history nearly impossible.

**Detection commands:**

```bash
# Find low-quality commit messages
echo "=== Low Quality Messages ==="
for pattern in "^WIP" "^wip" "^fix$" "^Fix$" "^temp" "^TODO" "^fixup" "^squash" "^asdf" "^test$" "^update$" "^changes$"; do
  count=$(git log --all --grep="$pattern" --oneline --since="6 months ago" | wc -l)
  [ $count -gt 0 ] && echo "$pattern: $count commits"
done

# Messages that are too short (<10 chars)
git log --format='%h %s' --since="6 months ago" | awk 'length($0) < 18 {print "SHORT:", $0}' | head -20

# Messages with "and" (multiple concerns - anti-pattern)
git log --grep=" and " --oneline --since="6 months ago" | head -10

# Messages without ticket/issue reference (if required)
git log --format='%s' --since="6 months ago" | grep -v -E '(#[0-9]+|[A-Z]+-[0-9]+)' | head -20
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| >10% WIP/fixup/temp commits | 🟠 HIGH | 10 |
| >20% messages <10 chars | 🟠 HIGH | 10 |
| No conventional commit format | 🟡 MEDIUM | 5 |
| >30% missing issue references | 🟡 MEDIUM | 5 |

---

### 3.4 Commit Clustering (Sprint/Friday Pattern)

**Why it matters:** Commit clustering indicates deadline-driven batching rather than continuous flow. Friday spikes often indicate rushed, untested code.

**Detection commands:**

```bash
# Commits by day of week
echo "=== Commits by Day of Week ==="
git log --format='%ad' --date=format:'%u %A' --since="6 months ago" | sort | uniq -c | sort -k2

# Commits by hour (detect after-hours work)
echo "=== Commits by Hour ==="
git log --format='%ad' --date=format:'%H' --since="6 months ago" | sort | uniq -c | sort -k2

# Sprint boundary clustering (assuming 2-week sprints)
echo "=== Commits by Day of Month ==="
git log --format='%ad' --date=format:'%d' --since="6 months ago" | sort | uniq -c | sort -rn | head -10
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Friday >25% of weekly commits | 🟠 HIGH | 10 |
| Last day of sprint >40% of sprint commits | 🔴 CRITICAL | 15 |
| Even distribution across week | ✅ Healthy | 0 |

---

## 4. CI/CD PRACTICE INDICATORS

### 4.1 Commit-to-Main Frequency (Deployment Frequency Proxy)

**Why it matters:** DORA research proves deployment frequency correlates with elite performance. This metric approximates deployment frequency from git history.

**Detection commands:**

```bash
# Commits to main per week (last quarter)
echo "=== Weekly Commit Frequency to Main ==="
git log main --since="3 months ago" --pretty=format:'%ad' --date=format:'%Y-W%V' | sort | uniq -c

# Per-developer daily commit rate to main
echo "=== Developer Commit Rates (last 30 days) ==="
git log main --since="30 days ago" --pretty=format:'%an' | sort | uniq -c | awk '{print $2": "$1/30" commits/day"}'

# Days with zero commits to main
echo "=== Days with No Commits ==="
git log main --since="30 days ago" --format='%ad' --date=format:'%Y-%m-%d' | sort -u > /tmp/commit_days.txt
# Compare against all days in range to find gaps
```

**Severity thresholds:**

| Frequency | Severity | Weight | DORA Level |
|-----------|----------|--------|------------|
| Multiple daily | ✅ Elite | 0 | Elite |
| Daily | ✅ High | 0 | High |
| Several per week | 🟡 MEDIUM | 5 | Medium |
| Weekly | 🟠 HIGH | 15 | Medium |
| Monthly | 🔴 CRITICAL | 25 | Low |

---

### 4.2 Revert Frequency (Change Failure Rate Proxy)

**Why it matters:** Reverts indicate failed deployments. High revert rates signal quality problems and correlate with DORA's Change Failure Rate metric.

**Detection commands:**

```bash
# Count reverts vs total commits
total=$(git log main --oneline --since="6 months ago" | wc -l)
reverts=$(git log main --grep="^Revert" --oneline --since="6 months ago" | wc -l)
rate=$(echo "scale=2; $reverts * 100 / $total" | bc)
echo "Revert rate: $rate% ($reverts of $total commits)"

# Reverts by month
echo "=== Reverts by Month ==="
git log main --grep="^Revert" --format='%ad' --date=format:'%Y-%m' --since="12 months ago" | sort | uniq -c

# Find what was reverted (patterns)
echo "=== Recent Reverts ==="
git log main --grep="^Revert" --oneline --since="3 months ago"

# Time between commit and revert (how fast failures detected)
git log main --grep="^Revert" --format='%H %s' --since="6 months ago" | while read hash msg; do
  original=$(echo "$msg" | grep -oE '[a-f0-9]{7,40}')
  [ -n "$original" ] && echo "Reverted: $original"
done
```

**Severity thresholds:**

| Revert Rate | Severity | Weight | DORA CFR |
|-------------|----------|--------|----------|
| <5% | ✅ Elite | 0 | 0-15% |
| 5-10% | 🟡 MEDIUM | 5 | 0-15% |
| 10-15% | 🟠 HIGH | 15 | 16-30% |
| 15-30% | 🔴 CRITICAL | 20 | 16-30% |
| >30% | 🔴 SEVERE | 25 | >30% |

---

### 4.3 Hotfix/Emergency Pattern

**Why it matters:** Frequent hotfixes indicate production quality issues and reactive (vs proactive) engineering culture.

**Detection commands:**

```bash
# Find hotfix branches
git branch -r | grep -iE 'hotfix|emergency|urgent|patch'

# Commits with hotfix indicators
git log --all --grep -iE 'hotfix|emergency|urgent|critical fix' --oneline --since="6 months ago" | wc -l

# Tags with hotfix pattern
git tag | grep -iE 'hotfix|patch' | wc -l
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| <1 hotfix/month | ✅ Healthy | 0 |
| 1-2 hotfixes/month | 🟡 MEDIUM | 5 |
| 3-4 hotfixes/month | 🟠 HIGH | 10 |
| >4 hotfixes/month | 🔴 CRITICAL | 20 |

---

## 5. COLLABORATION ANTI-PATTERNS

### 5.1 Knowledge Silos (Bus Factor)

**Why it matters:** Files owned >70% by a single author represent critical knowledge concentration risk. Research on 133 GitHub projects found 65% have bus factor ≤2.

**Detection commands:**

```bash
# Files with single author (bus factor = 1)
echo "=== Single-Author Files (High Risk) ==="
git ls-files | while read file; do
  authors=$(git log --follow --format='%an' -- "$file" 2>/dev/null | sort -u | wc -l)
  [ "$authors" -eq 1 ] && echo "$file"
done | head -30

# Calculate ownership concentration per file
echo "=== Ownership Concentration ==="
git ls-files '*.py' '*.js' '*.java' '*.go' | head -50 | while read file; do
  total=$(git log --format='%an' -- "$file" 2>/dev/null | wc -l)
  if [ $total -gt 5 ]; then
    top_author=$(git log --format='%an' -- "$file" | sort | uniq -c | sort -rn | head -1)
    top_count=$(echo $top_author | awk '{print $1}')
    pct=$(echo "scale=0; $top_count * 100 / $total" | bc)
    [ $pct -gt 70 ] && echo "$file: $pct% by $(echo $top_author | awk '{$1=""; print}')"
  fi
done

# Directory-level bus factor
echo "=== Directory Bus Factor ==="
find . -type d -maxdepth 2 | grep -v '.git' | while read dir; do
  authors=$(git log --format='%an' -- "$dir" 2>/dev/null | sort -u | wc -l)
  [ $authors -gt 0 ] && echo "$authors authors: $dir"
done | sort -n | head -20
```

**Severity thresholds:**

| Ownership | Severity | Weight |
|-----------|----------|--------|
| <50% single author | ✅ Distributed | 0 |
| 50-70% | 🟡 MEDIUM | 5 |
| 70-90% | 🟠 HIGH | 10 |
| >90% | 🔴 CRITICAL | 20 |
| >20% of files bus factor=1 | 🔴 CRITICAL | 20 |

---

### 5.2 After-Hours/Weekend Commits (Burnout Signal)

**Why it matters:** Research indicates 83% of developers suffer workplace burnout. Sustained after-hours patterns correlate with decreased quality and eventual attrition.

**Detection commands:**

```bash
# Weekend commits (Saturday=6, Sunday=7)
echo "=== Weekend Commit Frequency ==="
total=$(git log --since="6 months ago" --format='%ad' --date=format:'%u' | wc -l)
weekend=$(git log --since="6 months ago" --format='%ad' --date=format:'%u' | awk '$1>=6' | wc -l)
pct=$(echo "scale=1; $weekend * 100 / $total" | bc)
echo "Weekend commits: $pct% ($weekend of $total)"

# Weekend commits by author
echo "=== Weekend Commits by Author ==="
git log --since="6 months ago" --format='%an %ad' --date=format:'%u' | awk '$NF>=6 {count[$1]++} END {for(a in count) print count[a], a}' | sort -rn

# Late night commits (after 8pm, before 6am)
echo "=== Late Night Commits ==="
git log --since="6 months ago" --format='%an %ad' --date=format:'%H' | awk '($NF>=20 || $NF<6) {count[$1]++} END {for(a in count) print count[a], a}' | sort -rn

# Combined after-hours pattern
echo "=== After-Hours Summary ==="
git log --since="3 months ago" --format='%ad' --date=format:'%u-%H' | awk -F'-' '
  ($1>=6 || $2>=20 || $2<6) {after++}
  {total++}
  END {print "After-hours: " after/total*100 "%"}
'
```

**Severity thresholds:**

| After-Hours % | Severity | Weight |
|---------------|----------|--------|
| <10% | ✅ Normal | 0 |
| 10-20% | 🟡 MEDIUM | 5 |
| 20-30% | 🟠 HIGH | 10 |
| >30% | 🔴 CRITICAL | 15 |

---

### 5.3 Lack of Code Review Signals

**Why it matters:** Code review catches defects, spreads knowledge, and improves design. Absence of review indicators suggests bypassing quality gates.

**Detection commands:**

```bash
# Author vs Committer differences (indicates rebasing after review)
echo "=== Author != Committer (possible review) ==="
git log --format='%an|%cn' --since="6 months ago" | awk -F'|' '$1!=$2' | wc -l

# Merge commits (PRs typically create merges)
echo "=== Merge Commit Ratio ==="
merges=$(git log main --merges --oneline --since="6 months ago" | wc -l)
total=$(git log main --oneline --since="6 months ago" | wc -l)
echo "Merges: $merges of $total commits ($(echo "scale=1; $merges*100/$total" | bc)%)"

# Direct pushes to main (no PR)
echo "=== Direct Commits to Main ==="
git log main --no-merges --oneline --since="3 months ago" | wc -l

# Co-authored commits
echo "=== Pair Programming Indicators ==="
git log --all --grep="Co-authored-by" --oneline --since="6 months ago" | wc -l
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| >50% merges (PR workflow) | ✅ Healthy | 0 |
| <20% merges | 🟠 HIGH | 15 |
| 0% merges | 🔴 CRITICAL | 20 |
| >50% direct to main | 🟠 HIGH | 10 |

---

### 5.4 Pull Request Anti-Patterns

**Why it matters:** Google research found PRs over 400 lines receive diminishing review quality. Long-lived PRs create integration debt. PRs without meaningful review (rubber-stamp approvals) provide false confidence while missing defects.

**Detection commands:**

```bash
# Analyze merge commit patterns for PR characteristics
echo "=== Large Merge Commits (Large PR Indicator) ==="
git log --merges --pretty=format:'%H %s' --since="6 months ago" | while read hash msg; do
  changes=$(git show --stat $hash 2>/dev/null | tail -1)
  insertions=$(echo "$changes" | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' | head -1)
  [ -n "$insertions" ] && [ "$insertions" -gt 400 ] && echo "LARGE PR ($insertions lines): $msg"
done | head -20

# Rapid merges (might indicate rubber-stamp reviews)
echo "=== Rapid Merge Patterns ==="
git log --merges --format='%H %ct' --since="3 months ago" | while read hash merge_time; do
  # Get the branch tip commit time (approximation via parent)
  parent_time=$(git log -1 --format='%ct' ${hash}^2 2>/dev/null)
  if [ -n "$parent_time" ]; then
    hours=$(( (merge_time - parent_time) / 3600 ))
    [ "$hours" -lt 1 ] && echo "RAPID (<1h): $(git log -1 --format='%s' $hash)"
  fi
done | head -10

# Self-merges (author merged their own PR without review)
echo "=== Self-Merged PRs ==="
git log --merges --format='%H|%an|%cn' --since="6 months ago" | while IFS='|' read hash author committer; do
  # Check if PR author is same as merger
  pr_author=$(git log -1 --format='%an' ${hash}^2 2>/dev/null)
  [ "$pr_author" = "$committer" ] && echo "SELF-MERGE: $(git log -1 --format='%s' $hash)"
done | head -10

# PRs with single commit (might be squashed but losing history)
echo "=== Single-Commit Merges ==="
git log --merges --format='%H' --since="3 months ago" | while read hash; do
  commit_count=$(git log --oneline ${hash}^..${hash}^2 2>/dev/null | wc -l)
  [ "$commit_count" -eq 1 ] && echo "SINGLE COMMIT: $(git log -1 --format='%s' $hash)"
done | wc -l | xargs echo "Single-commit merges:"

# Commits referencing PRs/MRs
echo "=== PR Reference in Commits ==="
git log --oneline --since="6 months ago" | grep -cE '#[0-9]+|![0-9]+' | xargs echo "Commits with PR/MR refs:"
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| PRs averaging <400 lines | ✅ Healthy | 0 |
| PRs averaging 400-800 lines | 🟡 MEDIUM | 5 |
| PRs averaging >800 lines | 🟠 HIGH | 15 |
| >30% PRs merged in <1 hour | 🟡 MEDIUM | 5 |
| >20% self-merged PRs | 🟠 HIGH | 10 |
| No PR references in commit history | 🟠 HIGH | 10 |
| PRs open >7 days average | 🟠 HIGH | 10 |

---

### 5.5 Contributor Churn and Onboarding Signals

**Why it matters:** High contributor churn indicates team instability. New contributors without mentorship commits suggest poor onboarding. One-time contributors might indicate high friction to contribute.

**Detection commands:**

```bash
# Contributor timeline
echo "=== First and Last Commits by Author ==="
git shortlog -sn --all | head -20 | while read count author; do
  first=$(git log --author="$author" --format='%ad' --date=short --reverse | head -1)
  last=$(git log --author="$author" --format='%ad' --date=short | head -1)
  echo "$author: $first to $last ($count commits)"
done

# One-time contributors
echo "=== One-Time Contributors ==="
git shortlog -sn --since="1 year ago" | awk '$1==1 {print}' | wc -l | xargs echo "Authors with single commit:"

# Recent new contributors
echo "=== New Contributors (Last 3 Months) ==="
git log --format='%an' --since="3 months ago" | sort -u > /tmp/recent_authors.txt
git log --format='%an' --until="3 months ago" | sort -u > /tmp/old_authors.txt
comm -23 /tmp/recent_authors.txt /tmp/old_authors.txt 2>/dev/null | head -10

# Contributors who left (had commits >6mo ago, none since)
echo "=== Contributors Who Left ==="
git log --format='%an' --until="6 months ago" | sort -u > /tmp/old_authors2.txt
git log --format='%an' --since="6 months ago" | sort -u > /tmp/recent_authors2.txt
comm -23 /tmp/old_authors2.txt /tmp/recent_authors2.txt 2>/dev/null | head -10
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Stable contributor base | ✅ Healthy | 0 |
| >30% one-time contributors | 🟡 MEDIUM | 5 |
| >50% turnover in 12 months | 🟠 HIGH | 10 |
| 0 new contributors in 6 months | 🟡 MEDIUM | 5 |

---

## 6. HISTORY REWRITING ANTI-PATTERNS

### 6.1 Excessive Squash Merging

**Why it matters:** Linus Torvalds criticized GitHub's merge practices stating "GitHub creates absolutely useless garbage merges." Squashing destroys bisect capability (you land on +2000 line commits instead of isolating bugs), hides the evolution of thought, loses attribution, and breaks git's ability to detect equivalent commits via patch-id. Research shows squash merging causes recurring merge conflicts because Git can't recognize already-applied changes.

**Key problems:**
- **Bisect destruction:** "I hate when I bisect only to land on a single squashed commit that is +2000/-500. That is... not helpful at all."
- **Lost attribution:** Multiple authors combined into single commit, hampering accountability
- **Broken patch-id detection:** Git can no longer detect equivalent commits, causing repeated conflicts
- **Compliance issues:** Regulated industries (finance, healthcare, aerospace) require detailed commit history for audits

**Detection commands:**

```bash
# Detect squash merge pattern (large single commits with PR references)
echo "=== Potential Squash Merges (large single commits with PR#) ==="
git log main --no-merges --format='%H %s' --since="6 months ago" | while read hash msg; do
  if echo "$msg" | grep -qE '#[0-9]+'; then
    lines=$(git show --shortstat $hash 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+')
    [ -n "$lines" ] && [ "$lines" -gt 300 ] && echo "$hash ($lines lines): $msg"
  fi
done | head -20

# Ratio of merge commits to total (low ratio + PR workflow = squashing)
echo "=== Merge vs Non-Merge Ratio ==="
merges=$(git log main --merges --oneline --since="6 months ago" | wc -l)
non_merges=$(git log main --no-merges --oneline --since="6 months ago" | wc -l)
total=$((merges + non_merges))
merge_pct=$(echo "scale=1; $merges * 100 / $total" | bc 2>/dev/null || echo "N/A")
echo "Merges: $merges ($merge_pct%), Non-merges: $non_merges"

# Find commits that reference PRs but are unusually large
echo "=== Oversized PR Merges (>500 lines, single commit) ==="
git log main --no-merges --format='%H %s' --since="6 months ago" | while read hash msg; do
  if echo "$msg" | grep -qE '#[0-9]+'; then
    stat=$(git show --shortstat $hash 2>/dev/null | tail -1)
    insertions=$(echo "$stat" | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo 0)
    deletions=$(echo "$stat" | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo 0)
    total=$((insertions + deletions))
    [ "$total" -gt 500 ] && echo "$total lines: $msg"
  fi
done | sort -rn | head -10
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Squash for cleanup (<5 commits, <200 lines) | ✅ Appropriate | 0 |
| Squash with proper Co-authored-by preserved | ✅ Acceptable | 0 |
| >50% of PRs squashed to >300 line commits | 🟡 MEDIUM | 5 |
| Mandatory squash policy (no exceptions) | 🟠 HIGH | 10 |
| >80% PRs squashed to >500 line commits | 🔴 CRITICAL | 15 |
| Zero merge commits with PR workflow | 🟠 HIGH | 10 |
| Squash in regulated environment without audit trail | 🔴 CRITICAL | 20 |

---

### 6.2 Force Push to Shared Branches

**Why it matters:** Force pushing rewrites public history. When others have based work on the old commits, their branches diverge from the remote, creating "a world of confusion" requiring manual intervention. Julia Evans documents: "the missing commits might be split across many different people's reflogs and the only worse thing than having to hunt through the reflog is multiple people having to hunt through the reflog."

**Key problems:**
- **Divergent histories:** Collaborators' local branches no longer match remote
- **CI/CD breaks:** Pipelines often rely on consistent commit hashes
- **Lost work:** Others' commits can be overwritten
- **Coordination nightmare:** Everyone must `git fetch && git reset --hard`

**Detection commands:**

```bash
# Check reflog for force push evidence (local repo only)
echo "=== Force Push Indicators (Local Reflog) ==="
git reflog show --all 2>/dev/null | grep -iE "forced-update|reset.*hard|rebase.*finished" | head -20

# Detect potential forced updates via commit parent analysis
echo "=== Commits with Missing Parents (possible force push aftermath) ==="
git log --all --format='%H %P' --since="3 months ago" 2>/dev/null | while read hash parents; do
  for parent in $parents; do
    if ! git cat-file -e $parent 2>/dev/null; then
      echo "Commit $hash references missing parent $parent"
    fi
  done
done | head -10

# Detect unusually divergent branch histories
echo "=== Branches with Potential History Rewrites ==="
git for-each-ref --format='%(refname:short)' refs/remotes/ | grep -v HEAD | while read branch; do
  gaps=$(git log --format='%ct' $branch 2>/dev/null | sort -n | awk 'NR>1 && ($1-prev)>604800 {count++} {prev=$1} END {print count+0}')
  [ "$gaps" -gt 3 ] && echo "$branch: $gaps suspicious timeline gaps"
done
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Force push to personal feature branch | ✅ Acceptable | 0 |
| Force push with --force-with-lease | 🟡 MEDIUM | 5 |
| Force push to shared feature branch | 🟠 HIGH | 15 |
| Force push to develop/release branch | 🔴 CRITICAL | 20 |
| Force push to main/master | 🔴 CRITICAL | 25 |
| No branch protection on main | 🟠 HIGH | 15 |
| Force push allowed on protected branches | 🔴 CRITICAL | 20 |

---

### 6.3 Rebase on Shared/Public Branches

**Why it matters:** The official Git documentation warns: "Do not rebase commits that exist outside your repository and that people may have based work on." Rebasing shared branches creates new commit SHAs for the same changes, causing collaborators' branches to have invalid parent references. Atlassian's Golden Rule: "never rebase commits once they've been pushed to a public repository."

**Key problems:**
- **Duplicate commits:** Same changes appear twice with different SHAs
- **Forced merges:** Others must reconcile divergent histories
- **Review disruption:** Reviewers can't see incremental changes after rebase
- **Lost context:** Rebase rewrites timestamps, obscuring when work actually happened

**Detection commands:**

```bash
# Detect potential rebased branches (commits with same message, different SHA)
echo "=== Potential Duplicate Commits (rebase indicator) ==="
git log --all --format='%s' --since="3 months ago" | sort | uniq -d | head -10 | while read msg; do
  echo "Duplicate message: $msg"
  git log --all --oneline --grep="$msg" --fixed-strings | head -3
  echo "---"
done

# Find branches where author date != commit date significantly
echo "=== Rebased Commits (author date != commit date) ==="
git log --all --format='%H %ai %ci' --since="3 months ago" | awk '{
  split($2,ad,"-"); split($5,cd,"-")
  aday = ad[1]*10000 + ad[2]*100 + ad[3]
  cday = cd[1]*10000 + cd[2]*100 + cd[3]
  if(cday - aday > 7) print $1 " authored " $2 " committed " $5
}' | head -10

# Check for rebase patterns in reflog
echo "=== Rebase Activity in Reflog ==="
git reflog --all 2>/dev/null | grep -i "rebase" | head -20
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Rebase personal branch before PR | ✅ Best Practice | 0 |
| Interactive rebase to clean local history | ✅ Appropriate | 0 |
| Rebase shared feature branch (coordinated) | 🟡 MEDIUM | 5 |
| Rebase shared branch without coordination | 🟠 HIGH | 15 |
| Rebase after PR review started | 🟠 HIGH | 10 |
| Rebase long-lived branch repeatedly | 🔴 CRITICAL | 15 |
| Rebase main/develop | 🔴 CRITICAL | 25 |

---

### 6.4 Revert Chains (Revert of Revert)

**Why it matters:** Revert chains indicate hasty deployments, inadequate testing, and chaotic release management. A "revert of revert" pattern suggests features are being toggled via git operations rather than proper feature flags.

**Detection commands:**

```bash
# Find revert chains
echo "=== Revert Chains ==="
git log --all --grep="Revert" --oneline --since="6 months ago" | while read hash msg; do
  if echo "$msg" | grep -qi "revert.*revert"; then
    echo "REVERT CHAIN: $hash $msg"
  fi
done

# Find reverted commits that were later re-applied
echo "=== Reverted Then Re-applied ==="
git log --all --grep="^Revert" --format='%s' --since="6 months ago" | sed 's/Revert "\(.*\)"/\1/' | while read original; do
  reapplied=$(git log --all --oneline --grep="$original" --fixed-strings 2>/dev/null | wc -l)
  [ "$reapplied" -gt 1 ] && echo "Re-applied ($reapplied times): $original"
done | head -10

# Time between commit and revert (rapid reverts = quality issue)
echo "=== Rapid Reverts (<24 hours) ==="
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

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Occasional revert (<5% of commits) | ✅ Normal | 0 |
| Revert within 24h of commit | 🟡 MEDIUM | 5 |
| Revert of revert | 🟠 HIGH | 10 |
| >3 revert chains in 3 months | 🔴 CRITICAL | 15 |
| Same feature reverted multiple times | 🔴 CRITICAL | 20 |

---

### 6.5 WIP/Fixup Commits on Shared Branches

**Why it matters:** WIP commits pushed to shared branches indicate incomplete work is being integrated, breaking CI for others and cluttering history. Fixup commits that never get squashed create noise that hampers bisect and blame.

**Detection commands:**

```bash
# Find WIP commits on main/shared branches
echo "=== WIP Commits on Main ==="
git log main --grep -iE '^WIP|^wip:|work in progress' --oneline --since="6 months ago" | head -20

# Find fixup/squash commits that were never squashed
echo "=== Orphaned Fixup Commits ==="
git log main --grep -iE '^fixup!|^squash!' --oneline --since="6 months ago" | head -20

# Find "temp" or "test" commits
echo "=== Temporary Commits on Main ==="
git log main --grep -iE '^temp|^test$|^testing|^debug|DO NOT MERGE' --oneline --since="6 months ago" | head -20

# Commits with empty or minimal messages
echo "=== Commits with Poor Messages ==="
git log main --format='%h %s' --since="6 months ago" | awk 'length($0) < 15' | head -20
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| WIP on personal branch | ✅ Normal | 0 |
| WIP commits on main | 🟠 HIGH | 10 |
| Orphaned fixup! commits on main | 🟠 HIGH | 10 |
| >5% of main commits are WIP/temp | 🔴 CRITICAL | 15 |
| "DO NOT MERGE" commits merged | 🔴 CRITICAL | 20 |

---

## 7. CODE QUALITY FORENSICS

### 7.1 Churn Analysis (Defect Hotspots)

**Why it matters:** Microsoft Research found relative churn predicts defects with 89% accuracy. Files changing constantly indicate unstable design or accumulated technical debt.

**Detection commands:**

```bash
# Top 20 most frequently modified files (hotspots)
echo "=== Churn Hotspots (Most Modified Files) ==="
git log --format=format: --name-only --since="6 months ago" | egrep -v '^$' | sort | uniq -c | sort -rn | head -20

# Files with high churn AND many authors (complexity indicator)
echo "=== High Churn + Multiple Authors ==="
git log --format=format: --name-only --since="6 months ago" | egrep -v '^$' | sort | uniq -c | sort -rn | head -50 | while read count file; do
  [ $count -gt 10 ] && {
    authors=$(git log --format='%an' -- "$file" 2>/dev/null | sort -u | wc -l)
    [ $authors -gt 2 ] && echo "$count changes, $authors authors: $file"
  }
done

# Churn velocity (changes per week)
echo "=== Weekly Churn Rate ==="
git log --format=format: --name-only --since="4 weeks ago" | egrep -v '^$' | sort | uniq -c | sort -rn | head -10
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Hotspot >20 changes/month | 🟠 HIGH | 10 |
| Hotspot >50 changes/month | 🔴 CRITICAL | 15 |
| >10% of files are hotspots | 🟠 HIGH | 10 |

---

### 7.2 Temporal Coupling (Hidden Dependencies)

**Why it matters:** Files that frequently change together reveal hidden dependencies. Unexpected coupling between unrelated modules signals architectural decay.

**Detection commands:**

```bash
# Files changing together frequently
echo "=== Temporal Coupling Analysis ==="
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

# Coupling percentage
echo "=== High Coupling Pairs (>50% co-change) ==="
# Advanced: would require more complex analysis
```

**Severity thresholds:**

| Coupling | Severity | Weight |
|----------|----------|--------|
| Expected coupling (same module) | ✅ Normal | 0 |
| >50% coupling between unrelated files | 🟠 HIGH | 10 |
| >10 unexpected couplings | 🔴 CRITICAL | 15 |

---

### 7.3 Fix Commit Patterns

**Why it matters:** High density of fix commits shortly after feature commits indicates rushed, low-quality work.

**Detection commands:**

```bash
# Ratio of fix commits to total
echo "=== Fix Commit Ratio ==="
fixes=$(git log --all --grep -iE '^fix|bug|patch|repair' --oneline --since="6 months ago" | wc -l)
total=$(git log --all --oneline --no-merges --since="6 months ago" | wc -l)
pct=$(echo "scale=1; $fixes * 100 / $total" | bc)
echo "Fix commits: $pct% ($fixes of $total)"

# Fix commits following recent changes (bug introduction signal)
echo "=== Recent Fix Frequency ==="
git log --grep -iE '^fix' --format='%ad' --date=format:'%Y-%m' --since="6 months ago" | sort | uniq -c

# Test file commit ratio
echo "=== Test vs Production Code Ratio ==="
tests=$(git log --format=format: --name-only --since="6 months ago" | grep -iE 'test|spec' | wc -l)
prod=$(git log --format=format: --name-only --since="6 months ago" | grep -v -iE 'test|spec' | wc -l)
echo "Test file changes: $tests, Production: $prod (ratio: $(echo "scale=2; $tests/$prod" | bc))"
```

**Severity thresholds:**

| Fix Ratio | Severity | Weight |
|-----------|----------|--------|
| <20% | ✅ Normal | 0 |
| 20-30% | 🟡 MEDIUM | 5 |
| 30-50% | 🟠 HIGH | 10 |
| >50% | 🔴 CRITICAL | 15 |

---

### 7.4 Testing Pattern Analysis

**Why it matters:** The ratio of test code changes to production code changes indicates testing discipline. Teams practicing TDD show consistent test-first patterns. Absence of test changes alongside feature changes signals inadequate test coverage and higher defect risk.

**Detection commands:**

```bash
# Test vs Production file change ratio
echo "=== Test vs Production Change Ratio ==="
test_changes=$(git log --format=format: --name-only --since="6 months ago" | grep -ciE 'test|spec|_test\.|\.test\.|tests/')
prod_changes=$(git log --format=format: --name-only --since="6 months ago" | grep -cviE 'test|spec|_test\.|\.test\.|tests/|node_modules|vendor')
if [ "$prod_changes" -gt 0 ]; then
  ratio=$(echo "scale=2; $test_changes * 100 / $prod_changes" | bc)
  echo "Test changes: $test_changes, Production: $prod_changes, Ratio: $ratio%"
else
  echo "No production changes found"
fi

# Commits with tests vs commits without tests
echo "=== Commits Including Tests ==="
total_commits=$(git log --oneline --since="6 months ago" | wc -l)
commits_with_tests=$(git log --name-only --pretty=format:'COMMIT' --since="6 months ago" | awk '
  /^COMMIT$/ { if(has_test) with_test++; total++; has_test=0; next }
  /test|spec|_test\.|\.test\./ { has_test=1 }
  END { print with_test " of " total " commits include tests (" int(with_test*100/total) "%)" }
')
echo "$commits_with_tests"

# Feature commits without accompanying tests
echo "=== Feature Commits Without Tests ==="
git log --name-only --pretty=format:'%h|%s|COMMIT' --since="3 months ago" | awk -F'|' '
  /\|COMMIT$/ { 
    if(is_feature && !has_test) print hash " " msg
    is_feature=0; has_test=0; next 
  }
  /^[a-f0-9]+\|/ { hash=$1; msg=$2; if(msg ~ /feat|add|implement|new/) is_feature=1 }
  /test|spec/ { has_test=1 }
' | head -10

# Test file coverage of source directories
echo "=== Source Directories with Test Coverage ==="
for dir in $(find . -type d -maxdepth 2 | grep -vE 'node_modules|vendor|\.git|test' | head -10); do
  src_files=$(find "$dir" -name '*.js' -o -name '*.py' -o -name '*.java' -o -name '*.go' 2>/dev/null | grep -cv test)
  test_files=$(find "$dir" -name '*test*' -o -name '*spec*' 2>/dev/null | wc -l)
  [ "$src_files" -gt 0 ] && echo "$dir: $src_files source files, $test_files test files"
done

# Test additions vs deletions (test debt)
echo "=== Test Code Growth ==="
git log --numstat --since="6 months ago" -- '*test*' '*spec*' 2>/dev/null | awk '
  /^[0-9]+/ { adds+=$1; dels+=$2 }
  END { print "Test code: +" adds " -" dels " (net: " adds-dels ")" }
'
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Test/production ratio >30% | ✅ Healthy | 0 |
| Test/production ratio 15-30% | 🟡 MEDIUM | 5 |
| Test/production ratio <15% | 🟠 HIGH | 10 |
| <20% of commits include test changes | 🟠 HIGH | 10 |
| Negative net test code growth | 🔴 CRITICAL | 15 |
| Feature directories with 0 test files | 🟠 HIGH | 10 |

---

## 8. RELEASE PATTERN ANALYSIS

### 8.1 Release Cadence

**Why it matters:** Elite teams deploy on-demand, multiple times daily. Monthly or quarterly releases indicate low-performer patterns.

**Detection commands:**

```bash
# Time between releases
echo "=== Release Cadence ==="
git for-each-ref --sort=creatordate --format='%(creatordate:unix) %(refname:short)' refs/tags/ | awk '
  NR>1 {days=($1-prev)/86400; print prev_tag " -> " $2 ": " int(days) " days"}
  {prev=$1; prev_tag=$2}
' | tail -20

# Monthly release frequency
echo "=== Releases per Month ==="
git for-each-ref --format='%(creatordate:format:%Y-%m)' refs/tags/ | sort | uniq -c | tail -12

# Average days between releases
echo "=== Average Release Interval ==="
git for-each-ref --sort=creatordate --format='%(creatordate:unix)' refs/tags/ | awk '
  NR>1 {total+=$1-prev; count++}
  {prev=$1}
  END {print "Average: " total/count/86400 " days"}
'
```

**Severity thresholds:**

| Cadence | Severity | Weight | DORA Level |
|---------|----------|--------|------------|
| On-demand/daily | ✅ Elite | 0 | Elite |
| Weekly | ✅ High | 0 | High |
| Monthly | 🟠 HIGH | 10 | Medium |
| Quarterly | 🔴 CRITICAL | 20 | Low |

---

### 8.2 Code Freeze Detection

**Why it matters:** DORA research explicitly states elite teams never have code freeze or stabilization periods. Any freeze is a critical finding.

**Detection commands:**

```bash
# Gaps in commit activity (>7 days)
echo "=== Activity Gaps (Potential Code Freezes) ==="
git log main --format='%ct' --since="1 year ago" | sort -n | awk '
  NR>1 && ($1-prev)>604800 {
    print strftime("%Y-%m-%d", prev) " to " strftime("%Y-%m-%d", $1) ": " int(($1-prev)/86400) " day gap"
  } 
  {prev=$1}
'

# December/EOY freeze pattern
echo "=== Holiday Freeze Pattern ==="
git log main --format='%ad' --date=format:'%m' --since="2 years ago" | sort | uniq -c
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| No gaps >7 days | ✅ Elite | 0 |
| Occasional gaps (holidays) | 🟡 MEDIUM | 5 |
| Regular planned freezes | 🔴 CRITICAL | 20 |
| Release train model | 🔴 CRITICAL | 15 |

---

## 9. REPOSITORY HEALTH ANTI-PATTERNS

### 9.1 Large Binary Files

**Why it matters:** Git stores complete copies of binary files with each change, causing repository bloat. Large repos slow clone, fetch, and CI operations.

**Detection commands:**

```bash
# Find large files in repository
echo "=== Large Files in Repository ==="
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort -rnk2 | head -20 | while read hash size path; do
  [ $size -gt 1000000 ] && echo "$(($size/1024/1024))MB: $path"
done

# Check repository size
echo "=== Repository Size ==="
du -sh .git
git count-objects -vH

# Files not in LFS that should be
echo "=== Binary Files Not in LFS ==="
git ls-files | while read file; do
  file "$file" 2>/dev/null | grep -qE 'binary|image|video|audio' && echo "$file"
done | head -20

# Large blobs in history
echo "=== Largest Objects in History ==="
git verify-pack -v .git/objects/pack/*.idx 2>/dev/null | sort -k3 -rn | head -10
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Repo <100MB | ✅ Healthy | 0 |
| Repo 100MB-500MB | 🟡 MEDIUM | 5 |
| Repo 500MB-1GB | 🟠 HIGH | 10 |
| Repo >1GB | 🔴 CRITICAL | 15 |
| Binary files >10MB not in LFS | 🟠 HIGH | 10 |

---

### 9.2 Sensitive Data / Secrets

**Why it matters:** GitGuardian detected over 10 million secrets exposed in 2022 alone. AWS Labs created git-secrets specifically to address this pervasive problem. As the GitGuardian team notes: "If you perform a search on GitHub for the commit message 'removed aws key', you will find thousands of results." Once pushed, secrets should be considered compromised regardless of subsequent removal because automated bots continuously scan public repositories for leaked credentials.

**Comprehensive detection commands:**

```bash
# Common secret patterns in current files
echo "=== Potential Secrets in Current Files ==="
git grep -E -i '(api[_-]?key|apikey|secret[_-]?key|password|passwd|pwd|token|auth[_-]?token|credential|private[_-]?key)[\s]*[=:][\s]*["\047]?[A-Za-z0-9/+=]{16,}' -- ':!*.lock' ':!package-lock.json' 2>/dev/null | head -20

# AWS keys pattern (AKIA prefix is standard for AWS access keys)
echo "=== Potential AWS Keys ==="
git grep -E 'AKIA[0-9A-Z]{16}' 2>/dev/null
git log -p --all --since="1 year ago" | grep -E 'AKIA[0-9A-Z]{16}' | head -5

# AWS Secret Access Keys (40 character base64)
echo "=== Potential AWS Secret Keys ==="
git grep -E '[A-Za-z0-9/+=]{40}' -- '*.py' '*.js' '*.java' '*.go' '*.rb' '*.env*' '*config*' 2>/dev/null | grep -vi 'test\|example\|sample\|placeholder' | head -10

# GitHub tokens (ghp_, gho_, ghu_, ghs_, ghr_ prefixes)
echo "=== Potential GitHub Tokens ==="
git grep -E 'gh[pousr]_[A-Za-z0-9]{36}' 2>/dev/null

# Slack tokens
echo "=== Potential Slack Tokens ==="
git grep -E 'xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}' 2>/dev/null

# Private keys in files
echo "=== Private Key Files ==="
git ls-files | grep -iE '\.(pem|key|p12|pfx|ppk|der)$'

# Private key headers in content
echo "=== Private Key Content ==="
git grep -l 'BEGIN.*PRIVATE KEY' 2>/dev/null
git grep -l 'BEGIN RSA PRIVATE' 2>/dev/null
git grep -l 'BEGIN EC PRIVATE' 2>/dev/null

# Environment files
echo "=== Env Files in Repository ==="
git ls-files | grep -iE '^\.env$|\.env\.|\.env-|env\.local|\.secrets'

# Config files that might contain secrets
echo "=== Config Files to Review ==="
git ls-files | grep -iE 'config\.(json|yml|yaml|xml|ini|properties)$|secrets?\.(json|yml|yaml)$|credentials' | head -20

# Database connection strings
echo "=== Potential DB Connection Strings ==="
git grep -E '(mysql|postgres|mongodb|redis)://[^@]+@' 2>/dev/null | head -5

# High entropy strings (potential secrets) - simplified heuristic
echo "=== High Entropy Strings ==="
git grep -E '[A-Za-z0-9+/]{32,}[=]{0,2}' -- '*.py' '*.js' '*.java' '*.env*' 2>/dev/null | grep -v 'test\|example\|node_modules' | head -10

# Secrets in git history
echo "=== Secrets in History (scan last 100 commits) ==="
git log -p -100 2>/dev/null | grep -E -i 'password\s*[=:]\s*["\047][^"\047]+["\047]' | head -5

# Check for commits that "removed" secrets
echo "=== Commits Removing Secrets (indicates prior leak) ==="
git log --all --oneline --grep='remove.*key\|remove.*secret\|remove.*password\|remove.*credential' | head -10

# Recommendation for comprehensive scanning
echo ""
echo "=== Recommended Tools for Comprehensive Scan ==="
echo "1. gitleaks detect --source . --verbose"
echo "2. trufflehog git file://. --since-commit HEAD~500"
echo "3. git-secrets --scan (AWS Labs tool)"
echo "4. detect-secrets scan ."
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| No secrets detected | ✅ Healthy | 0 |
| .env files committed | 🟠 HIGH | 15 |
| Config files with password fields | 🟠 HIGH | 15 |
| API keys detected | 🔴 CRITICAL | 25 |
| Private keys detected | 🔴 CRITICAL | 25 |
| AWS/cloud credentials | 🔴 CRITICAL | 25 |
| Database connection strings | 🔴 CRITICAL | 25 |
| History of "removed secret" commits | 🟠 HIGH | 15 |
| No secret scanning in CI pipeline | 🟠 HIGH | 10 |

**Critical remediation steps if secrets found:**
1. **Immediately rotate** the exposed credential (assume compromised)
2. Remove from current working tree (.gitignore won't help with already-tracked files)
3. Use BFG Repo Cleaner or git-filter-repo to purge from history
4. Force push to all remotes
5. Notify affected services/vendors
6. Implement pre-commit hooks to prevent future leaks

---

### 9.3 Vendor/Dependency Commit Anti-Patterns

**Why it matters:** Committing vendor or dependency directories (node_modules, vendor, packages) bloats repositories, creates noise in diffs, and makes meaningful commits hard to find. The GitHub gist "Vendoring is a vile anti-pattern" argues that copying third-party code into repositories "breaks the association between source code files and their canonical version control." This practice also hides security updates from upstream packages.

**Detection commands:**

```bash
# Find committed dependency directories
echo "=== Vendor/Dependency Directories in Repository ==="
git ls-files | grep -E '^node_modules/|^vendor/|^packages/|^bower_components/|^deps/|^third_party/' | head -5 && \
git ls-files | grep -cE '^node_modules/|^vendor/|^packages/|^bower_components/' | xargs echo "Total vendor files:"

# Check for large dependency commits
echo "=== Large Dependency Commits ==="
git log --all --oneline --diff-filter=A -- 'node_modules/*' 'vendor/*' 2>/dev/null | head -10

# Find lock file changes without corresponding code changes
echo "=== Lock File Only Commits ==="
git log --oneline --since="3 months ago" -- '*lock*' '*-lock.json' 'yarn.lock' | while read hash msg; do
  other_files=$(git show --stat $hash -- ':!*lock*' 2>/dev/null | wc -l)
  [ "$other_files" -lt 3 ] && echo "LOCK ONLY: $hash $msg"
done | head -10

# Detect commits that modify vendor directories
echo "=== Recent Vendor Directory Changes ==="
git log --oneline --since="6 months ago" -- 'vendor/' 'node_modules/' 'third_party/' 2>/dev/null | wc -l | xargs echo "Commits touching vendor dirs:"

# Check for vendored code without version tracking
echo "=== Vendor Directories Without Version Info ==="
for dir in vendor third_party deps; do
  if [ -d "$dir" ]; then
    find "$dir" -name 'VERSION' -o -name 'version.txt' -o -name '*.version' 2>/dev/null | wc -l | xargs echo "$dir version files:"
  fi
done

# Large third-party libraries that should be dependencies
echo "=== Large Vendored Items ==="
for dir in vendor third_party node_modules; do
  if [ -d "$dir" ]; then
    du -sh "$dir"/* 2>/dev/null | sort -rh | head -5
  fi
done
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| No vendor directories in git | ✅ Healthy | 0 |
| .gitignore includes vendor dirs | ✅ Healthy | 0 |
| node_modules committed | 🔴 CRITICAL | 20 |
| vendor/ committed (when pkg mgr exists) | 🟠 HIGH | 15 |
| >10% of repo is vendored code | 🟠 HIGH | 15 |
| Vendored code modified locally | 🔴 CRITICAL | 20 |
| No dependency lock files | 🟡 MEDIUM | 5 |

**Recommended alternatives:**
1. Use package managers (npm, pip, Maven, Go modules, Cargo)
2. Use lock files for reproducible builds
3. Cache dependencies in CI rather than committing
4. If vendoring is truly necessary, use dedicated tools (go mod vendor, composer)

---

### 9.4 Submodule Anti-Patterns

**Why it matters:** Heroku documentation states "Submodules can be confusing and error-prone." AWS Well-Architected DevOps Guidance lists submodules as an anti-pattern, noting they "can hinder development speed, increase the risk of errors, and introduce potential security concerns." Christophe Porteneuve writes: "if the technological context allows for packaging and formal dependency management, you should absolutely go this route instead."

**Key problems:**
- **Sync failures:** Pushing main without pushing submodule leaves collaborators broken
- **Complex updates:** "Nuanced update lifecycle" causes confusion
- **Merge conflicts:** Divergent submodule references are notoriously hard to resolve
- **CI complexity:** Build failures when submodule commits don't exist on remote
- **Nested nightmare:** Submodules within submodules multiply all problems

**Detection commands:**

```bash
# Check for submodules
echo "=== Submodule Inventory ==="
if [ -f .gitmodules ]; then
  echo "Submodules found:"
  git config --file .gitmodules --get-regexp path | awk '{print $2}'
  echo ""
  echo "Total: $(git config --file .gitmodules --get-regexp path | wc -l) submodules"
else
  echo "No submodules configured"
fi

# Check submodule status
echo "=== Submodule Health ==="
git submodule status 2>/dev/null || echo "No submodules or not initialized"

# Check for uninitialized submodules
echo "=== Uninitialized Submodules ==="
git submodule status 2>/dev/null | grep '^-' | head -10

# Check for modified submodules (dirty state)
echo "=== Modified Submodules ==="
git submodule status 2>/dev/null | grep '^+' | head -10

# Check for nested submodules
echo "=== Nested Submodules (anti-pattern) ==="
find . -name .gitmodules -not -path './.gitmodules' 2>/dev/null

# Detect submodule commits not pushed
echo "=== Submodule Sync Issues ==="
git submodule foreach --quiet 'echo "Checking $name..."; git log origin/HEAD..HEAD --oneline 2>/dev/null | head -3'

# Find submodule update frequency
echo "=== Submodule Update History ==="
git log --all --oneline -- .gitmodules 2>/dev/null | head -10
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| 0 submodules | ✅ Ideal | 0 |
| 1-2 submodules (justified, active) | 🟢 LOW | 3 |
| 3-5 submodules | 🟡 MEDIUM | 5 |
| >5 submodules | 🟠 HIGH | 10 |
| Nested submodules | 🔴 CRITICAL | 15 |
| Submodules out of sync | 🟠 HIGH | 10 |
| Submodules pointing to non-existent commits | 🔴 CRITICAL | 15 |
| Submodule instead of package manager | 🟠 HIGH | 10 |

**Recommended alternatives:**
- Package managers (npm, pip, Maven, Go modules)
- Git subtree (content in main repo, simpler workflow)
- Monorepo (all code in one repository)

---

### 9.4 Authorship/Identity Issues

**Why it matters:** Git allows commits on behalf of unverified third parties. DZone's Git Patterns guide notes: "Git is designed to allow commits on behalf of a potentially unverified third person." Inconsistent author information breaks accountability, compliance audits, and contribution tracking.

**Detection commands:**

```bash
# Find commits with suspicious author emails
echo "=== Suspicious Author Emails ==="
git log --all --format='%ae' --since="1 year ago" | sort -u | grep -iE 'example\.com|localhost|noreply|root@|admin@' | head -10

# Find commits where author != committer (may be legitimate rebasing)
echo "=== Author != Committer ==="
git log --all --format='%an <%ae>|%cn <%ce>' --since="6 months ago" | awk -F'|' '$1 != $2' | sort | uniq -c | sort -rn | head -10

# Find multiple email addresses for same name
echo "=== Inconsistent Email for Same Author ==="
git log --all --format='%an|%ae' --since="1 year ago" | sort -u | awk -F'|' '
  {
    if(name[$1] && name[$1] != $2) print $1 ": " name[$1] " AND " $2
    name[$1] = $2
  }
' | head -10

# Find generic/placeholder author names
echo "=== Generic Author Names ==="
git log --all --format='%an' --since="1 year ago" | sort -u | grep -iE '^(root|admin|user|test|unknown|anonymous)$' | head -10

# Check for unsigned commits (if signing is required)
echo "=== Unsigned Commits (if GPG signing required) ==="
unsigned=$(git log --all --format='%H %G?' --since="3 months ago" | grep -E ' N$| U$' | wc -l)
total=$(git log --all --oneline --since="3 months ago" | wc -l)
echo "Unsigned: $unsigned of $total commits"

# Check author domain diversity
echo "=== Author Email Domains ==="
git log --all --format='%ae' --since="1 year ago" | sed 's/.*@//' | sort | uniq -c | sort -rn | head -10
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Consistent author info | ✅ Healthy | 0 |
| Multiple emails per author (>2) | 🟡 MEDIUM | 5 |
| Generic/placeholder author names | 🟠 HIGH | 10 |
| Commits from localhost/example.com | 🟠 HIGH | 10 |
| No GPG signing (if policy requires) | 🟡 MEDIUM | 5 |
| >20% author != committer | 🟡 MEDIUM | 5 |

---

### 9.5 Monorepo Scale Anti-Patterns

**Why it matters:** Linus Torvalds stated that "Git fundamentally never really looks at less than the whole repo... Git scales really badly if you force it to look at everything as one huge repository." Atlassian's tutorial notes that in monorepos, "commits in unrelated parts of the tree affect the subtree that is relevant to a developer." Canva engineering described their monorepo reaching 500,000+ files where `git status` took 10+ seconds. Ken Muse argues that a monorepo "should be a tool of last resort" due to the inherent scaling challenges.

**Key problems:**
- **Performance degradation:** Every git command (status, log, blame, bisect) must traverse the entire tree
- **CI/CD complexity:** Every commit potentially triggers builds for all projects
- **Ref explosion:** Large numbers of branches and tags slow clone, fetch, and push operations
- **Index bloat:** The `.git/index` file grows linearly with files, slowing all operations
- **Unrelated noise:** Developers receive notifications and merge conflicts for code they don't touch

**Detection commands:**

```bash
# Repository scale metrics
echo "=== Monorepo Scale Assessment ==="
echo "Total files: $(git ls-files | wc -l)"
echo "Total commits: $(git rev-list --count HEAD 2>/dev/null || git log --oneline | wc -l)"
echo "Total branches: $(git branch -r | wc -l)"
echo "Total tags: $(git tag | wc -l)"
echo "Index size: $(ls -lh .git/index 2>/dev/null | awk '{print $5}')"
echo "Pack size: $(git count-objects -vH 2>/dev/null | grep 'size-pack' | awk '{print $2}')"

# Measure git status time
echo "=== Performance Check ==="
echo "git status timing:"
time git status >/dev/null 2>&1

# Check for unrelated top-level directories (monorepo structure)
echo "=== Top-Level Structure ==="
ls -d */ 2>/dev/null | head -20

# Find independent projects (separate package.json, go.mod, pom.xml, etc.)
echo "=== Independent Project Markers ==="
find . -maxdepth 3 -name 'package.json' -o -name 'go.mod' -o -name 'pom.xml' -o -name 'Cargo.toml' -o -name 'setup.py' 2>/dev/null | wc -l | xargs echo "Project roots found:"

# Commits per top-level directory (detect activity distribution)
echo "=== Activity by Top-Level Directory ==="
for dir in $(ls -d */ 2>/dev/null | head -10); do
  count=$(git log --oneline --since="3 months ago" -- "$dir" 2>/dev/null | wc -l)
  echo "$dir: $count commits"
done | sort -t: -k2 -rn

# Check for recommended monorepo optimizations
echo "=== Monorepo Optimization Status ==="
git config core.fsmonitor && echo "fsmonitor: enabled" || echo "fsmonitor: not configured"
git config core.untrackedCache && echo "untrackedCache: enabled" || echo "untrackedCache: not configured"
git config feature.manyFiles && echo "feature.manyFiles: enabled" || echo "feature.manyFiles: not configured"

# Contributors per project area (siloed teams indicator)
echo "=== Team Distribution ==="
for dir in $(ls -d */ 2>/dev/null | head -5); do
  authors=$(git log --format='%ae' --since="6 months ago" -- "$dir" 2>/dev/null | sort -u | wc -l)
  echo "$dir: $authors unique contributors"
done
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| <10,000 files | ✅ Manageable | 0 |
| 10,000-50,000 files | 🟡 MEDIUM | 5 |
| 50,000-200,000 files | 🟠 HIGH | 10 |
| >200,000 files | 🔴 CRITICAL | 15 |
| git status >5 seconds | 🟠 HIGH | 10 |
| git status >30 seconds | 🔴 CRITICAL | 20 |
| >100 independent projects in one repo | 🟠 HIGH | 10 |
| No fsmonitor/manyFiles optimization | 🟡 MEDIUM | 5 |
| Siloed teams (no cross-project commits) | 🟡 MEDIUM | 5 |

**Recommended mitigations:**
1. Enable fsmonitor with Watchman: `git config core.fsmonitor true`
2. Enable untracked cache: `git config core.untrackedCache true`
3. Enable manyFiles feature: `git config feature.manyFiles true`
4. Use sparse checkout for large monorepos
5. Consider extracting independent services to separate repositories
6. Use Scalar (Microsoft's monorepo optimization tool)

---

### 9.6 Tag/Versioning Anti-Patterns

**Why it matters:** Inconsistent tagging makes releases unreproducible, breaks changelogs, and complicates rollback. Missing or erratic version tags signal ad-hoc release processes.

**Detection commands:**

```bash
# List all tags with dates
echo "=== Release Tag History ==="
git for-each-ref --sort=-creatordate --format='%(creatordate:short) %(refname:short)' refs/tags/ | head -20

# Check tag naming consistency
echo "=== Tag Naming Patterns ==="
git tag | head -50 | awk '
  /^v[0-9]/ { v_prefix++ }
  /^[0-9]/ { no_prefix++ }
  /release/ { release++ }
  { total++ }
  END {
    print "v-prefixed: " v_prefix
    print "No prefix: " no_prefix
    print "Release-style: " release
    print "Total: " total
  }
'

# Check for semantic versioning compliance
echo "=== Semantic Versioning Compliance ==="
git tag | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+' | wc -l
echo "vs total tags: $(git tag | wc -l)"

# Find untagged releases (large time gaps between tags)
echo "=== Tag Cadence (days between releases) ==="
git for-each-ref --sort=creatordate --format='%(creatordate:unix) %(refname:short)' refs/tags/ | awk '
  NR>1 { days=($1-prev)/86400; if(days>30) print int(days) " days: " prev_tag " -> " $2 }
  { prev=$1; prev_tag=$2 }
' | tail -10

# Check for lightweight vs annotated tags
echo "=== Tag Types ==="
lightweight=0; annotated=0
for tag in $(git tag | head -20); do
  if git cat-file -t $tag 2>/dev/null | grep -q "tag"; then
    annotated=$((annotated+1))
  else
    lightweight=$((lightweight+1))
  fi
done
echo "Annotated: $annotated, Lightweight: $lightweight"

# Check for orphan tags (not on any branch)
echo "=== Orphan Tags (not reachable from main) ==="
for tag in $(git tag | head -20); do
  if ! git merge-base --is-ancestor $tag main 2>/dev/null; then
    echo "Orphan: $tag"
  fi
done | head -5

# Find tags pointing to same commit
echo "=== Duplicate Tags (same commit) ==="
git for-each-ref --format='%(objectname:short) %(refname:short)' refs/tags/ | sort | awk '
  prev_hash == $1 { print "Duplicate: " prev_tag " and " $2 " -> " $1 }
  { prev_hash=$1; prev_tag=$2 }
' | head -5
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Consistent semantic versioning | ✅ Healthy | 0 |
| Tags every release | ✅ Healthy | 0 |
| Mixed tag naming conventions | 🟡 MEDIUM | 5 |
| >50% lightweight tags | 🟡 MEDIUM | 5 |
| No tags in >90 days | 🟠 HIGH | 10 |
| No tags at all | 🔴 CRITICAL | 15 |
| Orphan tags | 🟠 HIGH | 10 |
| Version number gaps (skipped versions) | 🟡 MEDIUM | 5 |

---

## 10. COMMIT MESSAGE QUALITY

### 10.1 Message Content Anti-Patterns

**Why it matters:** Chris Beams' influential "How to Write a Git Commit Message" established seven rules that have become industry standard. Poor messages make debugging, auditing, and understanding change history nearly impossible. Kosta Harlan identified "and" in commit subjects as an anti-pattern indicating multiple concerns in one commit.

**The Seven Rules (Chris Beams):**
1. Separate subject from body with blank line
2. Limit subject to 50 characters
3. Capitalize the subject line
4. Do not end subject with period
5. Use imperative mood in subject
6. Wrap body at 72 characters
7. Use body to explain what and why, not how

**Detection commands:**

```bash
# Subject line too long (>50 chars is warning, >72 is problematic)
echo "=== Subject Lines >72 Characters ==="
git log --format='%s' --since="6 months ago" | awk 'length > 72 {print length": "$0}' | head -10

# Subject line too short (<10 chars is likely useless)
echo "=== Subject Lines <10 Characters ==="
git log --format='%h %s' --since="6 months ago" | awk 'length($2) < 10' | head -10

# Messages ending with period
echo "=== Subjects Ending with Period ==="
git log --format='%s' --since="6 months ago" | grep '\.$' | head -10

# "And" in subject (multiple concerns)
echo "=== Multiple Concerns ('and' in subject) ==="
git log --format='%s' --since="6 months ago" | grep -iE ' and ' | head -10

# Past tense instead of imperative
echo "=== Past Tense (should be imperative) ==="
git log --format='%s' --since="6 months ago" | grep -iE '^(added|fixed|updated|changed|removed|deleted|created|implemented)' | head -10

# Messages that are just ticket references
echo "=== Ticket-Only Messages ==="
git log --format='%s' --since="6 months ago" | grep -E '^[A-Z]+-[0-9]+$|^#[0-9]+$' | head -10

# Generic useless messages
echo "=== Generic/Useless Messages ==="
git log --format='%s' --since="6 months ago" | grep -iE '^(fix|update|change|modify|refactor|cleanup|misc|stuff|things|wip|test)$' | head -20

# Missing body for large changes
echo "=== Large Changes Without Body ==="
git log --format='%H %s%n%b---' --since="3 months ago" | awk '
  /^[a-f0-9]{40}/ { hash=$1; subject=substr($0,42) }
  /^---$/ {
    if(hash && !body) {
      cmd = "git show --shortstat " hash " 2>/dev/null | tail -1"
      cmd | getline stat; close(cmd)
      if(match(stat, /[0-9]+ insertion/)) {
        ins = substr(stat, RSTART, RLENGTH)
        gsub(/ insertion/, "", ins)
        if(ins+0 > 100) print hash ": " subject
      }
    }
    body = 0; hash = ""
  }
  /./ && !/^[a-f0-9]{40}/ && !/^---$/ { body = 1 }
' | head -10
```

**Severity thresholds:**

| Pattern | Severity | Weight |
|---------|----------|--------|
| Follows conventional commits | ✅ Elite | 0 |
| >20% subjects >72 chars | 🟡 MEDIUM | 5 |
| >10% generic/useless messages | 🟠 HIGH | 10 |
| >20% past tense | 🟡 MEDIUM | 5 |
| >5% ticket-only messages | 🟠 HIGH | 10 |
| >30% missing issue references (if required) | 🟡 MEDIUM | 5 |
| Large changes without body explanation | 🟠 HIGH | 10 |

---

## 11. AUDIT SCORING FRAMEWORK

### Complete Anti-Pattern Checklist with Weights

**Branching & Workflow (Sections 1-2)**

| # | Anti-Pattern | Detection | Max Weight |
|---|--------------|-----------|------------|
| 1 | Feature branches >7 days | Branch age | 25 |
| 2 | Feature branches 3-7 days | Branch age | 15 |
| 3 | Branch-per-environment exists | Branch naming | 15 |
| 4 | Environment branches diverged >10 commits | Divergence calc | 25 |
| 5 | Big bang merges >100 files | Merge analysis | 20 |
| 6 | Stale branches >100 total | Branch count | 10 |
| 7 | >20 branches stale >90 days | Branch age | 10 |
| 8 | Cherry-picks for promotion | Message grep | 20 |
| 9 | >20 duplicate commits detected | Patch-id analysis | 20 |
| 10 | GitFlow with >3 hotfixes/month | Branch pattern | 20 |
| 11 | GitFlow feature branches >7 days | GitFlow analysis | 15 |

**Merge Strategy (Section 2.2-2.3)**

| # | Anti-Pattern | Detection | Max Weight |
|---|--------------|-----------|------------|
| 12 | Squash merges consistently >1000 lines | Diffstat | 20 |
| 13 | Squash + no PR commit history | Merge analysis | 20 |
| 14 | <1 commit per day (severe squashing) | Commit frequency | 15 |
| 15 | Pure rebase (0% merges) + complex project | Merge ratio | 10 |

**Commit Hygiene (Section 3)**

| # | Anti-Pattern | Detection | Max Weight |
|---|--------------|-----------|------------|
| 16 | Commits >1000 lines | Diffstat | 20 |
| 17 | Commits 500-1000 lines (>10%) | Diffstat | 10 |
| 18 | Weekly or less commit frequency | Author analysis | 20 |
| 19 | >10% WIP/fixup/temp messages | Message grep | 10 |
| 20 | Friday clustering >25% | Day analysis | 10 |
| 21 | >20% poor commit messages (<10 chars) | Message length | 10 |
| 22 | >10% generic useless messages | Message grep | 10 |

**CI/CD Practice Indicators (Section 4)**

| # | Anti-Pattern | Detection | Max Weight |
|---|--------------|-----------|------------|
| 23 | Monthly or less deployment frequency | Tag frequency | 20 |
| 24 | Revert rate >15% | Revert grep | 20 |
| 25 | Revert rate 10-15% | Revert grep | 10 |
| 26 | >4 hotfixes/month | Hotfix grep | 20 |
| 27 | Code freeze detected | Activity gaps | 20 |

**Collaboration & Review (Section 5)**

| # | Anti-Pattern | Detection | Max Weight |
|---|--------------|-----------|------------|
| 28 | Bus factor=1 >20% files | Author analysis | 20 |
| 29 | After-hours >30% | Timestamp | 15 |
| 30 | No review signals (<20% merges) | Merge ratio | 15 |
| 31 | >50% direct commits to main | PR analysis | 15 |
| 32 | PRs averaging >800 lines | PR size analysis | 15 |
| 33 | >20% self-merged PRs | Merge author | 10 |
| 34 | >50% contributor turnover in 12 months | Author history | 10 |

**History Rewriting (Section 6)**

| # | Anti-Pattern | Detection | Max Weight |
|---|--------------|-----------|------------|
| 35 | Mandatory squash with >500 line commits | Merge pattern | 15 |
| 36 | Force push to main/develop | Reflog/protection | 25 |
| 37 | Force push to shared branch | Reflog | 15 |
| 38 | Rebase on shared branches | Commit dates | 15 |
| 39 | Revert of revert chains | Revert grep | 15 |
| 40 | WIP commits merged to main | Message grep | 15 |
| 41 | Orphaned fixup! commits on main | Message grep | 10 |

**Code Quality Forensics (Section 7)**

| # | Anti-Pattern | Detection | Max Weight |
|---|--------------|-----------|------------|
| 42 | Churn hotspot >50 changes/month | Churn analysis | 15 |
| 43 | Fix commit ratio >50% | Message grep | 15 |
| 44 | Temporal coupling anomalies >10 | Coupling analysis | 10 |
| 45 | Test/production ratio <15% | File analysis | 10 |
| 46 | <20% commits include test changes | Commit analysis | 10 |
| 47 | Negative net test code growth | Test diff | 15 |

**Release Patterns (Section 8)**

| # | Anti-Pattern | Detection | Max Weight |
|---|--------------|-----------|------------|
| 48 | No tags at all | Tag count | 15 |
| 49 | Quarterly releases | Tag frequency | 15 |
| 50 | Inconsistent tag naming | Tag patterns | 5 |
| 51 | No tags in >90 days | Tag recency | 10 |

**Repository Health (Section 9)**

| # | Anti-Pattern | Detection | Max Weight |
|---|--------------|-----------|------------|
| 52 | Repository >1GB | Size check | 15 |
| 53 | Repository 500MB-1GB | Size check | 10 |
| 54 | Binary files >10MB not in LFS | File analysis | 10 |
| 55 | Secrets/credentials detected | Pattern grep | 25 |
| 56 | Database connection strings exposed | Pattern grep | 25 |
| 57 | History of "removed secret" commits | Message grep | 15 |
| 58 | node_modules/vendor committed | File analysis | 20 |
| 59 | Vendored code modified locally | Diff analysis | 20 |
| 60 | >5 submodules | Submodule count | 10 |
| 61 | Nested submodules | Submodule check | 15 |
| 62 | Submodules out of sync | Submodule status | 10 |
| 63 | Generic/placeholder author names | Author analysis | 10 |
| 64 | Multiple emails per author (>2) | Author analysis | 5 |
| 65 | >50,000 files (monorepo scale) | File count | 10 |
| 66 | git status >5 seconds | Performance | 10 |
| 67 | >200,000 files without optimization | Monorepo check | 15 |

**Commit Messages (Section 10)**

| # | Anti-Pattern | Detection | Max Weight |
|---|--------------|-----------|------------|
| 68 | >20% subjects >72 chars | Message length | 5 |
| 69 | >10% generic/useless messages | Message grep | 10 |
| 70 | >5% ticket-only messages | Message grep | 10 |
| 71 | Large changes without body explanation | Message/diff | 10 |

**Maximum Possible Score: ~900+ points**

### Score Interpretation

| Score Range | Assessment | DORA Equivalent | Recommendation |
|-------------|------------|-----------------|----------------|
| 0-75 | Elite | Elite | Minor optimization opportunities |
| 76-150 | High Performer | High | Specific improvement areas |
| 151-300 | Medium Performer | Medium | Systematic process issues |
| 301-500 | Low Performer | Low | Significant transformation needed |
| >500 | Crisis | Below Low | Fundamental rebuild required |

### Priority Remediation Order

Based on DORA research impact, address anti-patterns in this order:

1. **Immediate (Week 1):** Secrets in repo, force push to main, code freeze, node_modules committed
2. **Urgent (Sprint 1):** Long-lived branches, branch-per-environment, cherry-pick promotion
3. **High (Sprint 2-3):** Large commits, low commit frequency, bus factor issues, squash abuse
4. **Medium (Month 1-2):** Poor messages, submodule complexity, GitFlow overhead
5. **Ongoing:** Churn hotspots, after-hours patterns, tag consistency, test coverage

---

## Quick Start Audit Script

```bash
#!/bin/bash
# Git Anti-Patterns Quick Audit v3.0
# Run from repository root
# Produces triage-level assessment of delivery health

echo "=========================================="
echo "GIT ANTI-PATTERNS QUICK AUDIT v3.0"
echo "=========================================="
echo "Repository: $(basename $(pwd))"
echo "Date: $(date)"
echo "=========================================="

echo -e "\n=== 1. BRANCH HEALTH ==="
echo "Remote branches: $(git branch -r | wc -l)"
echo "Unmerged branches: $(git branch -r --no-merged origin/main 2>/dev/null | wc -l)"
echo "Environment branches: $(git branch -r | grep -iE '(dev|staging|prod|uat)$' | wc -l)"
echo "GitFlow detected: $(git branch -r | grep -c 'origin/develop')"

echo -e "\n=== 2. COMMIT PATTERNS (Last 90 days) ==="
total=$(git log --oneline --since='90 days ago' | wc -l)
merges=$(git log --merges --oneline --since='90 days ago' | wc -l)
reverts=$(git log --grep='^Revert' --oneline --since='90 days ago' | wc -l)
cherries=$(git log --grep='cherry picked' --oneline --since='90 days ago' | wc -l)
echo "Total commits: $total"
echo "Merge commits: $merges ($(echo "scale=0; $merges*100/$total" | bc 2>/dev/null || echo 0)%)"
echo "Reverts: $reverts ($(echo "scale=1; $reverts*100/$total" | bc 2>/dev/null || echo 0)%)"
echo "Cherry-picks: $cherries"

echo -e "\n=== 3. COMMIT SIZE ANALYSIS ==="
git log --shortstat --format='' --since='90 days ago' | awk '
  /files? changed/ {
    match($0, /([0-9]+) insertion/, ins)
    match($0, /([0-9]+) deletion/, del)
    total = ins[1] + del[1]
    if(total > 1000) huge++
    else if(total > 500) large++
    else if(total > 200) medium++
    else small++
    count++
  }
  END {
    print "Small (<200 lines): " small+0
    print "Medium (200-500): " medium+0
    print "Large (500-1000): " large+0
    print "Huge (>1000): " huge+0
  }
'

echo -e "\n=== 4. CONTRIBUTOR HEALTH ==="
echo "Active contributors (90d): $(git shortlog -sn --since='90 days ago' | wc -l)"
weekend=$(git log --format='%ad' --date=format:'%u' --since='90 days ago' | awk '$1>=6' | wc -l)
total_90d=$(git log --oneline --since='90 days ago' | wc -l)
echo "Weekend commits: $weekend ($(echo "scale=0; $weekend*100/$total_90d" | bc 2>/dev/null || echo 0)%)"

echo -e "\n=== 5. REPOSITORY SIZE ==="
du -sh .git 2>/dev/null | awk '{print "Git directory: " $1}'
git count-objects -vH 2>/dev/null | grep 'size-pack' | awk '{print "Pack size: " $2}'
echo "Total files: $(git ls-files | wc -l)"

echo -e "\n=== 6. SECRETS CHECK (basic) ==="
secrets=$(git grep -lE 'AKIA[0-9A-Z]{16}|password\s*=|api[_-]?key\s*=' 2>/dev/null | wc -l)
env_files=$(git ls-files | grep -cE '\.env$|\.env\.')
echo "Potential secret files: $secrets"
echo "Env files in repo: $env_files"

echo -e "\n=== 7. RELEASE CADENCE ==="
tags_year=$(git tag --sort=-creatordate | head -50 | wc -l)
last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
echo "Tags (recent 50): $tags_year"
echo "Last tag: $last_tag"

echo -e "\n=== 8. CODE CHURN HOTSPOTS (Top 5) ==="
git log --format=format: --name-only --since="90 days ago" | egrep -v '^$' | sort | uniq -c | sort -rn | head -5

echo -e "\n=== 9. SUBMODULES ==="
if [ -f .gitmodules ]; then
  echo "Submodules: $(git config --file .gitmodules --get-regexp path | wc -l)"
  git config --file .gitmodules --get-regexp path | awk '{print "  - " $2}'
else
  echo "No submodules"
fi

echo -e "\n=== 10. VENDOR/DEPENDENCY DIRECTORIES ==="
git ls-files | grep -cE '^node_modules/|^vendor/' | xargs echo "Vendored files:"

echo -e "\n=========================================="
echo "QUICK TRIAGE RESULTS"
echo "=========================================="

# Calculate quick score
score=0
[ $(git branch -r | wc -l) -gt 100 ] && score=$((score + 10)) && echo "⚠ >100 branches"
[ $reverts -gt $((total / 10)) ] && score=$((score + 20)) && echo "⚠ High revert rate"
[ $cherries -gt 10 ] && score=$((score + 15)) && echo "⚠ Cherry-pick activity"
[ $secrets -gt 0 ] && score=$((score + 25)) && echo "🔴 CRITICAL: Potential secrets detected"
[ $env_files -gt 0 ] && score=$((score + 15)) && echo "⚠ Env files committed"
[ $(git branch -r | grep -cE '(dev|staging|prod)$') -gt 0 ] && score=$((score + 15)) && echo "⚠ Environment branches detected"

echo ""
echo "Quick Score: $score"
if [ $score -lt 25 ]; then
  echo "Assessment: HEALTHY"
elif [ $score -lt 75 ]; then
  echo "Assessment: NEEDS ATTENTION"
elif [ $score -lt 150 ]; then
  echo "Assessment: SIGNIFICANT ISSUES"
else
  echo "Assessment: CRITICAL - IMMEDIATE ACTION REQUIRED"
fi

echo -e "\n=========================================="
echo "Run detailed framework commands for full assessment"
echo "=========================================="
```

---

## Conclusion

This framework transforms git repositories into delivery health dashboards with 71 distinct anti-patterns across 11 categories. The research consensus from DORA, Accelerate, and practitioners like Fowler, Farley, Finster, and Humble is unambiguous: elite delivery correlates with trunk-based development, daily integration, small batches, and sustainable pace.

**Key prioritization insights:**

1. **Branch lifespan is the leading indicator** — Teams practicing true CI (branches <24 hours) outperform feature-branching teams by orders of magnitude. Thoughtworks explicitly placed "Long-lived branches with GitFlow" on their Technology Radar as a pattern to avoid.

2. **Commit size predicts defects** — Microsoft Research found relative churn measures predict fault-prone code with 89% accuracy. Google research shows PRs over 400 lines receive diminishing review quality.

3. **After-hours patterns predict attrition** — Sustained off-hours work precedes both quality degradation and team departures. Research indicates 83% of developers experience workplace burnout.

4. **Cherry-picking and environment branches** — These indicate fundamental misunderstanding of CD principles and should trigger immediate remediation. Oliver Davies, the dbt team, and Microsoft's Raymond Chen have all documented why cherry-picks create "time bombs."

5. **Squash-merge abuse destroys debugging capability** — Jake Worth notes: "For bisect to be useful, you must be committing atomically. If your practice is to squash-merge PRs, a bisect may only tell you that something broke when you merged in a huge PR."

6. **Secrets exposure is a crisis** — GitGuardian detected over 10 million exposed secrets in 2022. Any secrets finding requires immediate credential rotation, not just removal.

7. **Vendor commits create hidden debt** — Committing node_modules or vendor directories bloats repositories and obscures meaningful history while hiding security updates from upstream.

For audit engagements, run branch age, commit frequency, revert rate, and bus factor analyses first. These four measurements provide immediate triage of delivery health. Follow with secrets scanning and environment branch detection for critical findings.

---

**References:**

*Research & Books:*
- Forsgren, N., Humble, J., Kim, G. (2018). *Accelerate: The Science of Lean Software and DevOps*
- Humble, J., Farley, D. (2010). *Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation*
- Tornhill, A. (2015). *Your Code as a Crime Scene: Use Forensic Techniques to Arrest Defects*
- DORA State of DevOps Reports (2014-2024)

*Key Practitioner Sources:*
- Fowler, M. (2006). "Continuous Integration" - martinfowler.com
- Finster, B. et al. "Minimum CD" - minimumcd.org
- Humble, J. "Continuous Delivery" - continuousdelivery.com
- Davies, O. "Cherry-picking commits is an anti-pattern" - oliverdavies.uk
- Chen, R. "Stop cherry-picking, start merging" - Microsoft DevBlogs
- Stocker, G. "Please stop recommending Git Flow!" - georgestocker.com
- Hinshelwood, M. "Stop promoting branches" - nkdagility.com

*Platform & Tool Documentation:*
- Thoughtworks Technology Radar - "Long-lived branches with Gitflow"
- Atlassian Git Tutorials - Monorepos, Gitflow, Cherry-pick
- GitHub Documentation - Secret scanning
- GitLab Documentation - Secret detection
- Codefresh Blog - "Stop using branches for different environments"
- Heroku Dev Center - "Submodules can be confusing and error-prone"
- AWS Well-Architected DevOps Guidance - Anti-patterns

*Research Papers & Industry Studies:*
- Microsoft Research - Code churn predicts defects (89% accuracy)
- Google Research - PR size and review quality correlation
- North Carolina State University (2019) - "How Bad Can It Git?" GitHub secret leakage study
- GitGuardian State of Secrets Sprawl Report (2022-2023)
