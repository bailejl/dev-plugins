# Bad Git Repo Fixture

This fixture needs to be initialized with `bash setup-fixture.sh` before use.
It creates a git repository with intentional anti-patterns:

- **WIP commits**: "wip", "fix", "asdf", ".", "update", "temp"
- **Long-lived branches**: `feature/old-thing` (60+ days stale), `feature/abandoned-refactor`
- **Environment branches**: `dev`, `staging`, `production` diverged from main
- **Large binary**: 5MB PSD file committed directly (should use LFS or .gitignore)

These patterns are used by the `ai-readiness:git-health` eval suite.
