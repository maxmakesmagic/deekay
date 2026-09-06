# deekay

DeeKay is a Chrome and Firefox extension which tries to fix up broken articles on https://magic.wizards.com.

It leverages the [Ormos](https://github.com/maxmakesmagic/ormos) project research in that it uses a set of URLs which map from articles to their Wayback equivalents

## Releases

Releases are created automatically from commits merged to `main` using
[Conventional Commits](https://www.conventionalcommits.org/). Use `fix:` or
`perf:` for a patch release, `feat:` for a minor release, and a
`BREAKING CHANGE:` footer (or `!` after the commit type) for a major release.
Commits such as `docs:`, `chore:`, and `test:` do not create a release.

semantic-release generates the version, release notes, tag, and installable ZIP.
Do not create release tags or edit the extension version manually.
The committed manifest intentionally keeps the `0.0.0-semantic-release`
placeholder. Builds and linting use an isolated source tree with a valid
development version, while releases use their generated version. The committed
manifest is never rewritten.

Successful releases are published to the Chrome Web Store automatically. The
`Publish to Chrome` workflow can also retry an existing GitHub release manually.
Publishing requires the `EXTENSION_ID`, `PUBLISHER_ID`, `CLIENT_ID`,
`CLIENT_SECRET`, and `REFRESH_TOKEN` repository secrets.
