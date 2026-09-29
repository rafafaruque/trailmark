import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { validateNoticeNarrative } from "../src/lib/ai/draft-notice";
import { strawberryWorkflow } from "../src/lib/workflow/replay";
import { strawberrySources } from "../src/lib/sources/records";

const prefix = "data/recordings/strawberry-fields-notice";
const record = JSON.parse(readFileSync(`${prefix}.json`, "utf8"));
const response = readFileSync(`${prefix}.response.txt`, "utf8");
const originalOutput = JSON.parse(response);
if (JSON.stringify(originalOutput) !== JSON.stringify(record.output))
  throw new Error("Original response and recorded output differ");
validateNoticeNarrative(originalOutput, strawberryWorkflow, strawberrySources);
writeFileSync(
  `${prefix}.validation.json`,
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      originalRunId: record.id,
      originalValidation: record.validation,
      correction:
        "Fixed validator omission: the separately retrieved contract source is part of the linked evidence set for notice drafting. The model correctly cited sf-contract; no output was changed and no model call was repeated.",
      responseSha256: createHash("sha256").update(response).digest("hex"),
      validation: { valid: true, errors: [] },
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
console.log(
  "Original notice response revalidated successfully; original failure retained.",
);
