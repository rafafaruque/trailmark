import { writeFileSync } from "node:fs";
import { readVerifiedHoldout } from "./holdout-artifacts";
const bundle = readVerifiedHoldout();
writeFileSync(
  "data/evals/holdout/results.json",
  JSON.stringify(bundle, null, 2) + "\n",
);
const { reports, ...metrics } = bundle.summary;
console.log(
  JSON.stringify(
    {
      ...metrics,
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
