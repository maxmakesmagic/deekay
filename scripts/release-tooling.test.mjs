import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { analyzeCommits } from "@semantic-release/commit-analyzer";
import { generateNotes } from "@semantic-release/release-notes-generator";

const require = createRequire(import.meta.url);
const releaseConfig = require("../release.config.cjs");
const root = fileURLToPath(new URL("..", import.meta.url));

function configuredPlugin(name) {
  const plugin = releaseConfig.plugins.find((candidate) => {
    const candidateName = Array.isArray(candidate) ? candidate[0] : candidate;
    return candidateName === name;
  });

  assert.ok(plugin, `${name} must be configured`);
  return Array.isArray(plugin) ? plugin[1] : {};
}

test("the configured conventional-commits plugins generate release notes", async () => {
  const commits = [
    { hash: "abc123", message: "feat: exercise release note generation" },
  ];
  const context = {
    branch: { name: "main" },
    commits,
    cwd: root,
    lastRelease: {
      version: "0.2.0",
      gitTag: "0.2.0",
      gitHead: "previous",
    },
    nextRelease: {
      version: "0.3.0",
      gitTag: "0.3.0",
      gitHead: "current",
    },
    options: {
      repositoryUrl: "https://github.com/maxmakesmagic/deekay.git",
      tagFormat: releaseConfig.tagFormat,
    },
    logger: { log() {} },
  };

  assert.equal(
    await analyzeCommits(
      configuredPlugin("@semantic-release/commit-analyzer"),
      context,
    ),
    "minor",
  );

  const notes = await generateNotes(
    configuredPlugin("@semantic-release/release-notes-generator"),
    context,
  );
  assert.match(notes, /exercise release note generation/i);
});

test("the production config releases only main and attaches the built ZIP", () => {
  assert.deepEqual(releaseConfig.branches, ["main"]);
  assert.equal(releaseConfig.tagFormat, "${version}");

  const execConfig = configuredPlugin("@semantic-release/exec");
  assert.match(execConfig.prepareCmd, /prepare-release\.mjs/);
  assert.match(execConfig.prepareCmd, /\$\{nextRelease\.version\}/);

  const githubConfig = configuredPlugin("@semantic-release/github");
  assert.deepEqual(githubConfig.assets, [
    {
      path: "deekay.zip",
      name: "deekay-${nextRelease.gitTag}.zip",
      label: "DeeKay ${nextRelease.gitTag}",
    },
  ]);
});
