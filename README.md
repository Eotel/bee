# bee

[![CI](https://img.shields.io/github/actions/workflow/status/Eotel/bee/ci.yml?logo=github&label=CI)](https://github.com/Eotel/bee/actions/workflows/ci.yml)
[![release](https://img.shields.io/github/v/release/Eotel/bee?include_prereleases)](https://github.com/Eotel/bee/releases)
[![node](https://img.shields.io/badge/node-%3E%3D20.18-brightgreen?logo=nodedotjs)](https://nodejs.org/)
[![license](https://img.shields.io/github/license/nulab/bee?logo=opensourceinitiative)](LICENSE)
[![docs](https://img.shields.io/badge/docs-Starlight-purple?logo=astro&logoColor=white)](https://nulab.github.io/bee)

Bring [Backlog](https://backlog.com/) to your command line.

This is Eotel's fork of [nulab/bee](https://github.com/nulab/bee), with fixes used before upstream adoption. Download the packed CLI from [GitHub Releases](https://github.com/Eotel/bee/releases). See [fork distribution](docs/fork.md) for included fixes and release maintenance.

The [upstream documentation](https://nulab.github.io/bee) covers shared commands. Use `bee <command> --help` for the installed fork's flags and behavior.

## Development

This is a pnpm workspace monorepo built with [Vite+](https://viteplus.dev/) (`vp`).

| Package               | Path                     | Description                                       |
| --------------------- | ------------------------ | ------------------------------------------------- |
| `@nulab/bee`          | `apps/cli`               | CLI entry point (commander + consola)             |
| `@repo/docs`          | `apps/docs`              | Documentation site (Astro Starlight)              |
| `@repo/backlog-utils` | `packages/backlog-utils` | Backlog API client wrapper                        |
| `@repo/cli-utils`     | `packages/cli-utils`     | Shared CLI utilities (output formatting, prompts) |
| `@repo/config`        | `packages/config`        | Configuration management                          |
| `@repo/test-utils`    | `packages/test-utils`    | Shared test helpers                               |
| `@repo/tsconfigs`     | `packages/tsconfigs`     | Shared TypeScript config                          |

For setup instructions, scripts, and contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Support

Report fork-specific problems through [GitHub Issues](https://github.com/Eotel/bee/issues).
You can write in English or Japanese.

## License

This project is licensed under the [MIT License](LICENSE).
