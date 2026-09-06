module.exports = {
  branches: ["main"],
  // Keep the tag format used by the existing releases (for example, 0.2.0).
  tagFormat: "${version}",
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      { preset: "conventionalcommits" },
    ],
    [
      "@semantic-release/release-notes-generator",
      { preset: "conventionalcommits" },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          "node scripts/prepare-release.mjs ${nextRelease.version}",
        successCmd:
          'if [ -n "$GITHUB_OUTPUT" ]; then printf "released=true\\nversion=${nextRelease.version}\\n" >> "$GITHUB_OUTPUT"; fi',
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [
          {
            path: "deekay.zip",
            name: "deekay-${nextRelease.gitTag}.zip",
            label: "DeeKay ${nextRelease.gitTag}",
          },
        ],
        successCommentCondition: false,
        failCommentCondition: false,
        releasedLabels: false,
      },
    ],
  ],
};
