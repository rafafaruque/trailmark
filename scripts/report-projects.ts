import { writeFileSync } from "node:fs";
import { readVerifiedProjects } from "./project-artifacts";
const bundle = readVerifiedProjects();
writeFileSync(
  "data/recordings/additional-projects/results.json",
  JSON.stringify(bundle, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    bundle.records.map((r) => ({
      project: r.caseId,
      valid: r.validation.valid,
      error: r.error,
      output: r.output,
    })),
    null,
    2,
  ),
);
