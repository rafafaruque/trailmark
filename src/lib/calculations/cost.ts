import { z } from "zod";

const cents = z.number().int().min(0).max(100_000_000);
export const pricingSchema = z.strictObject({
  id: z.string(),
  projectId: z.string(),
  currency: z.literal("USD"),
  scheduleReference: z.string(),
  preparedBy: z.string(),
  preparedAt: z.string(),
  estimateBasis: z.string(),
  rates: z
    .array(
      z.strictObject({
        id: z.string(),
        label: z.string(),
        unit: z.string(),
        unitRateCents: cents,
      }),
    )
    .min(1),
  quantities: z
    .array(
      z.strictObject({
        id: z.string(),
        group: z.string(),
        rateId: z.string(),
        quantityMilli: z.number().int().min(0).max(1_000_000_000),
        sourceId: z.string(),
        sourceField: z.string(),
        basis: z.string(),
        markupEligible: z.boolean(),
      }),
    )
    .min(1),
  markup: z.strictObject({
    basisPoints: z.number().int().min(0).max(10000),
    sourceId: z.string(),
    clauseId: z.string(),
    basis: z.string(),
  }),
});
export type Pricing = z.infer<typeof pricingSchema>;
export interface CalculatedLine {
  id: string;
  label: string;
  group: string;
  quantity: number;
  unit: string;
  unitRateCents: number;
  amountCents: number;
  formula: string;
  sourceId: string;
  sourceField: string;
  basis: string;
  markupEligible: boolean;
}
export interface CostCalculation {
  lines: CalculatedLine[];
  directCostCents: number;
  markupBaseCents: number;
  markupCents: number;
  totalCents: number;
  markupBasisPoints: number;
  pricingSourceId: string;
  scheduleReference: string;
}

export function moneyFromCents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
function roundedDivide(numerator: bigint, denominator: bigint) {
  const value = Number((numerator + denominator / BigInt(2)) / denominator);
  if (!Number.isSafeInteger(value))
    throw new Error("Cost exceeds safe integer range");
  return value;
}

/** Only trusted rate/quantity records are accepted. Detection output is never an input. */
export function calculateCosts(input: unknown): CostCalculation {
  const pricing = pricingSchema.parse(input);
  if (
    new Set(pricing.rates.map((rate) => rate.id)).size !== pricing.rates.length
  )
    throw new Error("Duplicate rate ID");
  if (
    new Set(pricing.quantities.map((item) => item.id)).size !==
    pricing.quantities.length
  )
    throw new Error("Duplicate quantity ID");
  const lines = pricing.quantities.map((item) => {
    const rate = pricing.rates.find((rate) => rate.id === item.rateId);
    if (!rate) throw new Error(`Unknown configured rate: ${item.rateId}`);
    const amountCents = roundedDivide(
      BigInt(item.quantityMilli) * BigInt(rate.unitRateCents),
      BigInt(1000),
    );
    const quantity = item.quantityMilli / 1000;
    return {
      id: item.id,
      label: rate.label,
      group: item.group,
      quantity,
      unit: rate.unit,
      unitRateCents: rate.unitRateCents,
      amountCents,
      formula: `${quantity} ${rate.unit} × ${moneyFromCents(rate.unitRateCents)}`,
      sourceId: item.sourceId,
      sourceField: item.sourceField,
      basis: item.basis,
      markupEligible: item.markupEligible,
    };
  });
  const directCostCents = lines.reduce(
    (sum, line) => sum + line.amountCents,
    0,
  );
  const markupBaseCents = lines
    .filter((line) => line.markupEligible)
    .reduce((sum, line) => sum + line.amountCents, 0);
  if (!Number.isSafeInteger(directCostCents))
    throw new Error("Cost total exceeds safe integer range");
  const markupCents = roundedDivide(
    BigInt(markupBaseCents) * BigInt(pricing.markup.basisPoints),
    BigInt(10000),
  );
  const totalCents = directCostCents + markupCents;
  if (!Number.isSafeInteger(totalCents))
    throw new Error("Marked-up total exceeds safe integer range");
  return {
    lines,
    directCostCents,
    markupBaseCents,
    markupCents,
    totalCents,
    markupBasisPoints: pricing.markup.basisPoints,
    pricingSourceId: pricing.id,
    scheduleReference: pricing.scheduleReference,
  };
}
