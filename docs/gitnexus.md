# GitNexus

GitNexus was configured for this repo with the least invasive path available on this Windows workstation. A global install was not used. The default npm cache and global Codex config paths were blocked by local permissions, so this repo uses a small launcher at `.tools/gitnexus.mjs` that runs the cached GitNexus CLI with a repo-local GitNexus home.

## Commands

Re-index the repo:

```powershell
npm run gitnexus:analyze
```

Show index status:

```powershell
npm run gitnexus:status
```

List indexed repos:

```powershell
npm run gitnexus:list
```

Start the web UI server:

```powershell
npm run gitnexus:serve
```

Start the MCP server:

```powershell
npm run gitnexus:mcp
```

## Generated Files

Do not commit generated local GitNexus state:

- `.gitnexus/`
- `.gitnexus-home/`
- `.gitnexus-runtime*/`
- `.gitnexus-tarballs/`
- `.gitnexus-backups/`
- `.npm-cache/`

Those paths are ignored in `.gitignore`. The tracked pieces are the npm scripts, this documentation file, and the `.tools/gitnexus.*` launcher files.

## Notes

The current index was created with `--index-only`, so GitNexus did not inject or overwrite `AGENTS.md`, `CLAUDE.md`, or editor-specific skill files. Kotlin parsing is currently skipped because the optional `tree-sitter-kotlin` native dependency is not installed in this environment.
