import { execFileSync } from "node:child_process";

import {
  DEVELOPMENT_VERSION,
  withVersionedExtension,
} from "./prepare-release.mjs";

await withVersionedExtension(DEVELOPMENT_VERSION, (sourceDir, root) => {
  execFileSync(
    "npx",
    [
      "--yes",
      "web-ext@10.6.0",
      "lint",
      "--source-dir",
      sourceDir,
      "--warnings-as-errors",
    ],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
});
