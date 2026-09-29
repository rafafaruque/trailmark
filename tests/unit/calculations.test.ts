import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateDeadline } from "../../src/lib/calculations/deadline";
import { calculateCosts } from "../../src/lib/calculations/cost";
import {
  projectPricing,
  projectTimezone,
  snapshotTime,
} from "../../src/lib/sources/records";

test("48 elapsed hours after received direction is Sept 30 at 10:43 AM", () => {
  const result = calculateDeadline(
    "2026-09-28T10:43:00-04:00",
    48,
    projectTimezone,
    snapshotTime,
  );
  assert.equal(result.deadline, "2026-09-30T14:43:00.000Z");
  assert.equal(result.deadlineLabel, "Sept 30, 10:43 AM");
  assert.equal(result.hoursRemaining, 18);
  assert.equal(result.overdue, false);
});

test("elapsed-hour math crosses daylight saving, leap day, and weekends without silent extensions", () => {
  const fall = calculateDeadline(
    "2026-10-31T10:43:00-04:00",
    48,
    projectTimezone,
    "2026-10-31T10:43:00-04:00",
  );
  assert.equal(fall.deadline, "2026-11-02T14:43:00.000Z");
  assert.equal(fall.deadlineLabel, "Nov 2, 9:43 AM");
  const leap = calculateDeadline(
    "2028-02-28T10:00:00Z",
    48,
    "UTC",
    "2028-02-28T10:00:00Z",
  );
  assert.equal(leap.deadline, "2028-03-01T10:00:00.000Z");
  const weekend = calculateDeadline(
    "2026-10-02T10:00:00Z",
    48,
    "UTC",
    "2026-10-02T10:00:00Z",
  );
  assert.equal(weekend.deadline, "2026-10-04T10:00:00.000Z");
});

test("deadline validation rejects ambiguous dates and invalid durations; expired dates are explicit", () => {
  for (const timestamp of [
    "Sept 28",
    "2026-09-28T10:43:00",
    "2026-02-30T10:00:00Z",
  ]) {
    assert.throws(() => calculateDeadline(timestamp, 48, "UTC", snapshotTime));
  }
  for (const period of [0, -1, 1.5, NaN, Infinity])
    assert.throws(() =>
      calculateDeadline(snapshotTime, period, "UTC", snapshotTime),
    );
  const expired = calculateDeadline(
    "2026-09-28T10:43:00-04:00",
    48,
    projectTimezone,
    "2026-10-01T10:43:00-04:00",
  );
  assert.equal(expired.overdue, true);
  assert.equal(expired.hoursRemaining, -24);
});

test("configured quantities and cents yield $18,420 including correct eligible markup", () => {
  const result = calculateCosts(projectPricing);
  assert.equal(result.directCostCents, 1_638_000);
  assert.equal(result.markupBaseCents, 1_632_000);
  assert.equal(result.markupCents, 204_000);
  assert.equal(result.totalCents, 1_842_000);
  const groups = Object.groupBy(result.lines, (line) => line.group);
  assert.equal(
    groups["Additional trenching"]!.reduce(
      (sum, line) => sum + line.amountCents,
      0,
    ),
    595_000,
  );
  assert.equal(
    groups["Conduit / material"]!.reduce(
      (sum, line) => sum + line.amountCents,
      0,
    ),
    460_000,
  );
  assert.equal(
    groups["Crew labor"]!.reduce((sum, line) => sum + line.amountCents, 0),
    493_000,
  );
  assert.equal(
    groups.Equipment!.reduce((sum, line) => sum + line.amountCents, 0),
    90_000,
  );
});

test("costs use half-up integer-cent rounding and reject missing rates, negatives, duplicates", () => {
  const tiny = structuredClone(projectPricing);
  tiny.rates[0].unitRateCents = 1;
  tiny.quantities = [{ ...tiny.quantities[0], quantityMilli: 1500 }];
  tiny.markup.basisPoints = 0;
  assert.equal(calculateCosts(tiny).totalCents, 2);
  const missing = structuredClone(projectPricing);
  missing.quantities[0].rateId = "invented";
  assert.throws(() => calculateCosts(missing), /Unknown configured rate/);
  const negative = structuredClone(projectPricing);
  negative.rates[0].unitRateCents = -100;
  assert.throws(() => calculateCosts(negative));
  const duplicate = structuredClone(projectPricing);
  duplicate.quantities.push(duplicate.quantities[0]);
  assert.throws(() => calculateCosts(duplicate), /Duplicate quantity/);
});
