# Fork distribution

Eotel/bee distributes a built npm-format tarball through GitHub Releases. The
executable remains `bee`, and the configuration format and location are unchanged.
The package keeps its upstream `@nulab/bee` name for workspace builds, but the fork
release workflow publishes only to GitHub Releases.

## Included fixes

- [Binary API responses](https://github.com/nulab/bee/pull/179): download attachment
  bytes through `bee api` without JSON decoding.
- [Comments in issue JSON](https://github.com/nulab/bee/pull/185): include fetched
  comments in `bee issue view --comments --json`.
- [Comment pagination](https://github.com/nulab/bee/pull/187): fetch every comment
  with `issue view --comments`; select comment pages with `issue comment --list`.
- [Endpoint query strings](https://github.com/nulab/bee/pull/189): combine a GET
  endpoint's query string with `-f` and `-F` fields.

Use the installed CLI's `--help` for fork-specific options. The upstream reference
may omit these changes. Both skills in `skills/` are distributed from the same
source commit as the CLI release.

## Release maintenance

1. Merge upstream updates and selected fixes into fork `main`, preserving the
   upstream and contribution branches. Resolve fixes already adopted upstream
   during that merge.
2. Set `apps/cli/package.json` to a new version such as `1.1.1-eotel.2`. Run
   `vp check`, `vp test`, `vp run -r build`, and
   `vp run --filter @nulab/bee generate:skill:check`.
3. Push `main` and an annotated tag matching that version. Use the tag annotation
   for release notes, including the changes and verification performed.
4. The Fork release workflow reruns CI, installs and starts the packed CLI on the
   supported Node versions, and publishes its `.tgz`, `SHA256SUMS`, and
   `SOURCE_COMMIT`. Upstream npm and Pages deployment jobs run only in nulab/bee.
5. Update consumers to the release asset and its hash. Regenerate the Nix runtime
   manifest and npm lock from the packed package, and pin both skills to the
   commit recorded in `SOURCE_COMMIT`.

For Nix, keep runtime dependencies in the Nix store with `buildNpmPackage`; the
tarball already includes `bin/` and `dist/`, so no source build is needed. Update
the version, source hash, runtime manifest, lockfile, and `npmDepsHash` together.
Keep MIT attribution when redistributing the fork.
