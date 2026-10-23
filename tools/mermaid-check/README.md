# mermaid-check

Parses **every** Mermaid block in `docs/` with mermaid's real parser. This is not a regex
linter: it catches the things that actually break rendering (`end` in labels, `+=` in sequence
messages, two key constraints on one ERD attribute).

## Run locally

```bash
cd tools/mermaid-check
npm install
npm run check
```

Output:

```
ok   03-flows.md #11 (line 428)
...
21 diagram(s) checked, 0 failure(s) in 8 file(s)
```

Exit code is non-zero on any parse failure, so it is usable as a pre-commit or CI step.

## CI

`ci-workflow.yml` in this folder is the ready-to-use GitHub Actions workflow. It is **not**
active because the repository token used for the initial push lacked the `workflow` scope.
To enable it, either:

1. **Re-authenticate with the scope** and move the file into place:
   ```bash
   gh auth refresh -s workflow
   mkdir -p .github/workflows && git mv tools/mermaid-check/ci-workflow.yml .github/workflows/docs.yml
   git commit -m "ci: validate mermaid diagrams on docs changes" && git push
   ```
2. **Or add it in the GitHub UI**: Actions → New workflow → paste the contents of
   `ci-workflow.yml`.

## Adding a diagram

- Quote any label containing `(`, `)`, `/`, `,` or a colon: `A["Less allowance (LLR)"]`.
- Never put `end` in a flowchart or sequence label unquoted.
- In sequence messages, avoid `+=`, `-=` and `;` — write words instead
  (`reduce available, increase reserved`).
- ERD: one key constraint per attribute (`uuid tenant_id FK`, not `FK UK`).
