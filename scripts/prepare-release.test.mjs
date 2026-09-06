import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createVersionedManifest,
  DEVELOPMENT_VERSION,
  prepareRelease,
  SEMANTIC_RELEASE_PLACEHOLDER,
  validateVersion,
} from "./prepare-release.mjs";

async function createExtensionFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "deekay-release-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const originalManifest =
    `{"name":"deekay","version":"${SEMANTIC_RELEASE_PLACEHOLDER}"}\n`;
  await Promise.all([
    mkdir(path.join(root, "assets")),
    mkdir(path.join(root, "hashes")),
    writeFile(path.join(root, "manifest.json"), originalManifest),
    writeFile(path.join(root, "deekay.js"), "// extension\n"),
  ]);
  await Promise.all([
    writeFile(path.join(root, "assets", "icon.txt"), "icon\n"),
    writeFile(path.join(root, "hashes", "00.json"), "{}\n"),
  ]);

  return { root, originalManifest };
}

test("validates Chrome-compatible semantic versions", () => {
  assert.equal(validateVersion("1.2.3"), "1.2.3");
  assert.equal(validateVersion("65535.0.1"), "65535.0.1");

  for (const version of ["0.0.0", "1.2", "1.2.3-beta.1", "01.2.3", "65536.1.1"]) {
    assert.throws(() => validateVersion(version));
  }
});

test("keeps the repository manifest on the semantic-release placeholder", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../manifest.json", import.meta.url), "utf8"),
  );

  assert.equal(manifest.version, SEMANTIC_RELEASE_PLACEHOLDER);
  assert.deepEqual(
    manifest.browser_specific_settings.gecko.data_collection_permissions,
    { required: ["browsingActivity"] },
  );
});

test("updates only the manifest version", () => {
  const result = createVersionedManifest(
    `{"name":"deekay","version":"${SEMANTIC_RELEASE_PLACEHOLDER}","manifest_version":3}`,
    "0.3.0",
  );

  assert.deepEqual(JSON.parse(result), {
    name: "deekay",
    version: "0.3.0",
    manifest_version: 3,
  });
  assert.match(result, /\n$/);
});

test("builds from an isolated versioned source tree", async (t) => {
  const { root, originalManifest } = await createExtensionFixture(t);

  let stagedVersion;
  let sourceVersionDuringBuild;
  let stagedAsset;
  await prepareRelease("0.2.1", {
    root,
    build: async (sourceDir) => {
      stagedVersion = JSON.parse(
        await readFile(path.join(sourceDir, "manifest.json"), "utf8"),
      ).version;
      sourceVersionDuringBuild = JSON.parse(
        await readFile(path.join(root, "manifest.json"), "utf8"),
      ).version;
      stagedAsset = await readFile(
        path.join(sourceDir, "assets", "icon.txt"),
        "utf8",
      );
    },
  });

  assert.equal(stagedVersion, "0.2.1");
  assert.equal(sourceVersionDuringBuild, SEMANTIC_RELEASE_PLACEHOLDER);
  assert.equal(stagedAsset, "icon\n");
  assert.equal(
    await readFile(path.join(root, "manifest.json"), "utf8"),
    originalManifest,
  );
});

test("uses a valid development version when no release version is supplied", async (t) => {
  const { root, originalManifest } = await createExtensionFixture(t);

  let stagedVersion;
  await prepareRelease(undefined, {
    root,
    build: async (sourceDir) => {
      stagedVersion = JSON.parse(
        await readFile(path.join(sourceDir, "manifest.json"), "utf8"),
      ).version;
    },
  });

  assert.equal(stagedVersion, DEVELOPMENT_VERSION);
  assert.equal(
    await readFile(path.join(root, "manifest.json"), "utf8"),
    originalManifest,
  );
});

test("rejects a changed source manifest version", () => {
  assert.throws(
    () => createVersionedManifest('{"version":"0.2.0"}', "0.3.0"),
    /must remain "0\.0\.0-semantic-release"/,
  );
});

test("removes the staging tree when the build fails", async (t) => {
  const { root, originalManifest } = await createExtensionFixture(t);

  let sourceDir;
  await assert.rejects(
    prepareRelease("0.2.1", {
      root,
      build: (stagedSourceDir) => {
        sourceDir = stagedSourceDir;
        throw new Error("build failed");
      },
    }),
    /build failed/,
  );

  await assert.rejects(access(sourceDir), (error) => error.code === "ENOENT");
  assert.equal(
    await readFile(path.join(root, "manifest.json"), "utf8"),
    originalManifest,
  );
});
