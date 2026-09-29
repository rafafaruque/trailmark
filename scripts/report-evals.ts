import { writeFileSync } from "node:fs";
import { readVerifiedEvaluation } from "./eval-artifacts";
const bundle = readVerifiedEvaluation();
writeFileSync(
  "data/evals/phase3-results.json",
  JSON.stringify(bundle, null, 2) + "\n",
);
const { reports, ...summary } = bundle.summary;
console.log(
  JSON.stringify(
    {
      ...summary,
      failures: reports
        .filter((r) => r.failures.length)
        .map((r) => ({
          caseId: r.caseId,
          failures: r.failures,
          missed: r.evidence.missedIds,
          unexpected: r.evidence.unexpectedIds,
        })),
    },
    null,
    2,
  ),
);
