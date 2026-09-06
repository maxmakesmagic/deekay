import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import semanticRelease from "semantic-release";

const require = createRequire(import.meta.url);
const releaseConfig = require("../release.config.cjs");

const DRY_RUN_BRANCH = "semantic-release-dry-run";
const SYNTHETIC_COMMIT = "fix: exercise release dry run";
const UNSAFE_DRY_RUN_PLUGINS = new Set(["@semantic-release/github"]);
const root = fileURLToPath(new URL("..", import.meta.url));

function git(cwd, ...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function pluginName(plugin) {
  return Array.isArray(plugin) ? plugin[0] : plugin;
}

function dryRunEnvironment(repository, commit) {
  const environment = { ...process.env };

  // Replace the surrounding PR metadata with a synthetic push for the isolated
  // repository, otherwise semantic-release intentionally exits before analysis.
  for (const name of Object.keys(environment)) {
    if (name.startsWith("GITHUB_")) {
      delete environment[name];
    }
  }
  Object.assign(environment, {
    CI: "true",
    GITHUB_ACTIONS: "true",
    GITHUB_EVENT_NAME: "push",
    GITHUB_REF: `refs/heads/${DRY_RUN_BRANCH}`,
    GITHUB_REPOSITORY: "local/deekay",
    GITHUB_RUN_ID: "dry-run",
    GITHUB_SERVER_URL: "https://github.com",
    GITHUB_SHA: commit,
    GITHUB_WORKSPACE: repository,
  });

  return environment;
}

const temporaryRoot = await mkdtemp(
  path.join(os.tmpdir(), "deekay-release-dry-run-"),
);
const repository = path.join(temporaryRoot, "repository");
const remote = path.join(temporaryRoot, "remote.git");

try {
  await Promise.all([mkdir(repository), mkdir(remote)]);

  git(repository, "init", "--initial-branch", DRY_RUN_BRANCH);
  git(
    repository,
    "fetch",
    "--no-recurse-submodules",
    "--tags",
    pathToFileURL(root).href,
    "HEAD",
  );
  git(repository, "checkout", "-B", DRY_RUN_BRANCH, "FETCH_HEAD");
  git(repository, "config", "user.name", "semantic-release dry run");
  git(repository, "config", "commit.gpgSign", "false");
  git(
    repository,
    "config",
    "user.email",
    "semantic-release-dry-run@example.invalid",
  );
  git(repository, "commit", "--allow-empty", "--message", SYNTHETIC_COMMIT);

  git(remote, "init", "--bare", "--initial-branch", DRY_RUN_BRANCH);
  git(
    repository,
    "push",
    "--force",
    "--tags",
    pathToFileURL(remote).href,
    `HEAD:refs/heads/${DRY_RUN_BRANCH}`,
  );

  const plugins = releaseConfig.plugins.filter(
    (plugin) => !UNSAFE_DRY_RUN_PLUGINS.has(pluginName(plugin)),
  );
  assert.equal(
    plugins.length,
    releaseConfig.plugins.length - UNSAFE_DRY_RUN_PLUGINS.size,
    "The dry run must exclude each external publishing plugin exactly once",
  );

  const result = await semanticRelease(
    {
      ...releaseConfig,
      branches: [DRY_RUN_BRANCH],
      repositoryUrl: pathToFileURL(remote).href,
      plugins,
      dryRun: true,
      ci: false,
    },
    {
      cwd: repository,
      env: dryRunEnvironment(repository, git(repository, "rev-parse", "HEAD")),
    },
  );

  assert.ok(result?.nextRelease, "The release dry run did not propose a release");
  assert.match(result.nextRelease.notes, /exercise release dry run/i);
  assert.equal(
    git(remote, "tag", "--list", result.nextRelease.gitTag),
    "",
    "A dry run must not create a tag",
  );

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `version=${result.nextRelease.version}\n`,
    );
  }

  console.log(
    `Dry run proposed ${result.nextRelease.gitTag} without publishing it.`,
  );
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
