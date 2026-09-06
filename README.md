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

Successful releases are submitted to the Chrome Web Store and Firefox Add-ons
automatically. The store publishing workflows can also retry an existing GitHub
release manually. Chrome publishing requires the `EXTENSION_ID`, `PUBLISHER_ID`,
`CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN` repository secrets. Firefox
publishing requires `MOZILLA_ISSUER` and `MOZILLA_SECRET`, available from the
[Firefox Add-ons API credentials page](https://addons.mozilla.org/en-US/developers/addon/api/key/).
Mozilla may hold a submitted update for automated or manual review before it is
published.

Pull requests run the release pipeline in dry-run mode against an isolated Git
remote. CI also builds the extension and passes its ZIP through both reusable
store publishing workflows for validation. The store API calls themselves are
skipped on pull requests, so publishing credentials are never exposed to PR
code.
