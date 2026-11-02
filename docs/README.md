# Docs

TexCraft is the product name. The repository is TexCraft (formerly LocalLatexEditor); the npm workspace is `local-latex-editor`.

## For students and users

| Read | For |
| --- | --- |
| [installation.md](installation.md) | Installing LaTeX and TexCraft on macOS, Windows and Linux; first launch; updating and uninstalling |
| [user-guide.md](user-guide.md) | Projects, editing, compiling, the main file, PDF preview, SyncTeX, errors, settings, shortcuts, where files are |
| [troubleshooting.md](troubleshooting.md) | LaTeX not found, missing packages, wrong fonts, projects that will not open, reporting a problem |

## For contributors

| Read | For |
| --- | --- |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Setup, code layout, conventions, tests, pull requests |
| [api-and-internal-contracts.md](api-and-internal-contracts.md) | Every HTTP route, environment variables, storage layout |
| [desktop-app.md](desktop-app.md) | How the Electron app is built, packaged, smoke-tested, signed and released |
| [../SECURITY.md](../SECURITY.md) | Security model and how to report a vulnerability |
| [../CHANGELOG.md](../CHANGELOG.md) | What changed in each release |
| [../AGENTS.md](../AGENTS.md) | Short orientation for coding agents |

## Archive

[archive/](archive/) holds the March and April 2026 plans: the requirements specification, system architecture, technology survey, phase plans, feature plans and design specs. They were written before the code and the app has moved past them. Some features they describe were never built (WebSockets, write-back import), others work differently. Read them for history, not as a description of this build.

`../design-system/latexeditor/` holds the navy and blue design notes the UI colors follow. The app does not import it.
