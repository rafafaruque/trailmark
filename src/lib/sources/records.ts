import dailyLog from "../../../data/raw/strawberry-fields/daily-log.json";
import email from "../../../data/raw/strawberry-fields/utility-email.json";
import rfi from "../../../data/raw/strawberry-fields/rfi-042.json";
import drawing from "../../../data/raw/strawberry-fields/drawing-e104-revc.json";
import contract from "../../../data/raw/strawberry-fields/contract.json";
import pricing from "../../../data/raw/strawberry-fields/pricing.json";
import cloverLog from "../../../data/raw/clover-court/daily-log.json";
import { normalizeSources } from "./normalize";

export const strawberryRawSources = [drawing, email, rfi, dailyLog, contract];
export const cloverRawSources = [cloverLog];
export const strawberrySources = normalizeSources(strawberryRawSources);
export const cloverSources = normalizeSources(cloverRawSources);
export const allRawSources = [...strawberryRawSources, ...cloverRawSources];
export const projectPricing = pricing;
export const snapshotTime = "2026-09-29T16:43:00-04:00";
export const projectTimezone = "America/New_York";
