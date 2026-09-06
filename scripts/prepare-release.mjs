import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const MAX_VERSION_COMPONENT = 65535;
const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const EXTENSION_PATHS = ["assets", "hashes", "deekay.js"];

export const DEVELOPMENT_VERSION = "0.0.1";
export const SEMANTIC_RELEASE_PLACEHOLDER = "0.0.0-semantic-release";

export function validateVersion(version) {
  const match = STABLE_VERSION.exec(version ?? "");
  if (!match) {
    throw new Error(
      `Extension version "${version}" must contain three numeric components`,
    );
  }

  const components = match.slice(1).map(Number);
  if (components.every((component) => component === 0)) {
    throw new Error("Extension version must not be all zero");
  }
  if (components.some((component) => component > MAX_VERSION_COMPONENT)) {
    throw new Error(
      `Extension version components must not exceed ${MAX_VERSION_COMPONENT}`,
    );
  }

  return version;
}

export function createVersionedManifest(source, version) {
  validateVersion(version);

  const manifest = JSON.parse(source);
  if (!manifest || Array.isArray(manifest) || typeof manifest !== "object") {
    throw new Error("manifest.json must contain a JSON object");
  }
  if (manifest.version !== SEMANTIC_RELEASE_PLACEHOLDER) {
    throw new Error(
      `manifest.json version must remain "${SEMANTIC_RELEASE_PLACEHOLDER}"`,
    );
  }

  manifest.version = version;
  return `${JSON.stringify(manifest, null, 4)}\n`;
}

function buildExtension(sourceDir, root) {
  execFileSync(
    path.join(root, "make_extension.sh"),
    [sourceDir, path.join(root, "deekay.zip")],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
}

export async function withVersionedExtension(
  version,
  task,
  { root = process.cwd(), temporaryRoot = os.tmpdir() } = {},
) {
  const sourceManifest = await readFile(path.join(root, "manifest.json"), "utf8");
  const versionedManifest = createVersionedManifest(sourceManifest, version);
  const sourceDir = await mkdtemp(path.join(temporaryRoot, "deekay-extension-"));

  try {
    await Promise.all(
      EXTENSION_PATHS.map((entry) =>
        cp(path.join(root, entry), path.join(sourceDir, entry), {
          recursive: true,
        }),
      ),
    );
    await writeFile(path.join(sourceDir, "manifest.json"), versionedManifest);
    return await task(sourceDir, root);
  } finally {
    await rm(sourceDir, { recursive: true, force: true });
  }
}

export async function prepareRelease(
  version = DEVELOPMENT_VERSION,
  {
    root = process.cwd(),
    temporaryRoot = os.tmpdir(),
    build = buildExtension,
  } = {},
) {
  return withVersionedExtension(version, build, { root, temporaryRoot });
}

const invokedPath = process.argv[1] && path.resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  await prepareRelease(process.argv[2]);
}
