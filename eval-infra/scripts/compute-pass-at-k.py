#!/usr/bin/env python3
"""Compute pass@k and pass^k metrics from promptfoo eval output.

pass@k  = probability that at least 1 of k independent samples passes
pass^k  = probability that all k independent samples pass

Usage:
    python compute-pass-at-k.py --results output.json --k 1 3 5
    python compute-pass-at-k.py --results output.json --k 1 5 10 --group-by suite
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any


def comb(n: int, k: int) -> int:
    """Binomial coefficient C(n, k)."""
    if k < 0 or k > n:
        return 0
    return math.comb(n, k)


def pass_at_k(n: int, c: int, k: int) -> float:
    """Unbiased estimator for pass@k.

    Args:
        n: total number of samples
        c: number of correct (passing) samples
        k: number of draws

    Returns:
        Probability that at least 1 of k samples passes.
    """
    if n < k:
        return float(c > 0)
    if c == 0:
        return 0.0
    if c == n:
        return 1.0
    # 1 - C(n-c, k) / C(n, k)
    return 1.0 - comb(n - c, k) / comb(n, k)


def pass_power_k(n: int, c: int, k: int) -> float:
    """Estimator for pass^k (all k samples pass).

    Args:
        n: total number of samples
        c: number of correct (passing) samples
        k: number of draws

    Returns:
        Probability that all k of k samples pass.
    """
    if n < k:
        return float(c == n and c >= k)
    if c == 0:
        return 0.0
    if c == n:
        return 1.0
    # C(c, k) / C(n, k)
    return comb(c, k) / comb(n, k)


def load_results(path: Path) -> list[dict[str, Any]]:
    """Load promptfoo JSON output and extract test results."""
    data = json.loads(path.read_text())

    # promptfoo output format: {"results": {"results": [...]}}
    # or sometimes {"results": [...]}
    if isinstance(data, dict):
        results = data.get("results", data)
        if isinstance(results, dict):
            results = results.get("results", [])
    elif isinstance(data, list):
        results = data
    else:
        print(f"Error: unexpected JSON structure in {path}", file=sys.stderr)
        sys.exit(1)

    return results


def extract_outcomes(
    results: list[dict[str, Any]], group_by: str | None
) -> dict[str, dict[str, int]]:
    """Extract pass/fail counts, optionally grouped.

    Returns:
        {group_key: {"n": total, "c": passing}}
    """
    groups: dict[str, dict[str, int]] = defaultdict(lambda: {"n": 0, "c": 0})

    for result in results:
        # Determine group key
        if group_by:
            metadata = result.get("testCase", {}).get("metadata", {})
            key = str(metadata.get(group_by, "unknown"))
        else:
            key = "all"

        groups[key]["n"] += 1

        # Check if the test passed
        success = result.get("success", False)
        if success:
            groups[key]["c"] += 1

    return dict(groups)


def format_pct(value: float) -> str:
    """Format a probability as a percentage string."""
    return f"{value * 100:6.1f}%"


def print_table(
    groups: dict[str, dict[str, int]],
    k_values: list[int],
) -> None:
    """Print a formatted table of pass@k and pass^k results."""
    # Header
    header_parts = [f"{'Group':<20} {'n':>5} {'c':>5}"]
    for k in k_values:
        header_parts.append(f" {'pass@' + str(k):>9}")
    for k in k_values:
        header_parts.append(f" {'pass^' + str(k):>9}")
    header = "".join(header_parts)

    separator = "-" * len(header)

    print(separator)
    print(header)
    print(separator)

    # Rows
    for group_name in sorted(groups.keys()):
        counts = groups[group_name]
        n, c = counts["n"], counts["c"]

        row_parts = [f"{group_name:<20} {n:>5} {c:>5}"]
        for k in k_values:
            row_parts.append(f" {format_pct(pass_at_k(n, c, k)):>9}")
        for k in k_values:
            row_parts.append(f" {format_pct(pass_power_k(n, c, k)):>9}")

        print("".join(row_parts))

    print(separator)

    # Totals
    total_n = sum(g["n"] for g in groups.values())
    total_c = sum(g["c"] for g in groups.values())
    totals = [f"{'TOTAL':<20} {total_n:>5} {total_c:>5}"]
    for k in k_values:
        totals.append(f" {format_pct(pass_at_k(total_n, total_c, k)):>9}")
    for k in k_values:
        totals.append(f" {format_pct(pass_power_k(total_n, total_c, k)):>9}")
    print("".join(totals))
    print(separator)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compute pass@k and pass^k metrics from promptfoo output.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
Examples:
  %(prog)s --results .promptfoo/output.json --k 1 3 5
  %(prog)s --results output.json --k 1 5 10 --group-by suite

Metrics:
  pass@k   Probability that at least 1 of k samples passes (optimistic).
  pass^k   Probability that all k samples pass (pessimistic / reliability).
""",
    )
    parser.add_argument(
        "--results",
        type=Path,
        required=True,
        help="Path to promptfoo JSON output file",
    )
    parser.add_argument(
        "--k",
        type=int,
        nargs="+",
        default=[1, 3, 5],
        help="Values of k to compute (default: 1 3 5)",
    )
    parser.add_argument(
        "--group-by",
        type=str,
        default=None,
        help="Metadata field to group results by (e.g., 'suite')",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON instead of a table",
    )

    args = parser.parse_args()

    if not args.results.exists():
        print(f"Error: file not found: {args.results}", file=sys.stderr)
        sys.exit(1)

    results = load_results(args.results)
    if not results:
        print("Error: no test results found in the output file.", file=sys.stderr)
        sys.exit(1)

    groups = extract_outcomes(results, args.group_by)

    if args.json:
        output: dict[str, Any] = {}

        # Per-group metrics
        group_list = []
        for group_name, counts in sorted(groups.items()):
            n, c = counts["n"], counts["c"]
            group_entry: dict[str, Any] = {
                "n": n,
                "c": c,
                "metrics": {
                    f"pass@{k}": round(pass_at_k(n, c, k), 4) for k in args.k
                }
                | {f"pass^{k}": round(pass_power_k(n, c, k), 4) for k in args.k},
            }
            # Include top-level pass@k for easy access
            for k in args.k:
                group_entry[f"pass@{k}"] = round(pass_at_k(n, c, k), 4)
            output[group_name] = group_entry

            # Also build the "groups" array entry with the group_by field
            if args.group_by:
                groups_entry = dict(group_entry)
                groups_entry[args.group_by] = group_name
                group_list.append(groups_entry)

        # Add "groups" array when --group-by is used
        if args.group_by and group_list:
            output["groups"] = group_list

        # Add totals
        total_n = sum(g["n"] for g in groups.values())
        total_c = sum(g["c"] for g in groups.values())
        output["total"] = {
            "n": total_n,
            "c": total_c,
            "metrics": {
                f"pass@{k}": round(pass_at_k(total_n, total_c, k), 4)
                for k in args.k
            }
            | {
                f"pass^{k}": round(pass_power_k(total_n, total_c, k), 4)
                for k in args.k
            },
        }

        json.dump(output, sys.stdout, indent=2)
        print()
    else:
        print(f"\nResults from: {args.results}")
        print(f"Total test results: {len(results)}")
        print()
        print_table(groups, args.k)


if __name__ == "__main__":
    main()
