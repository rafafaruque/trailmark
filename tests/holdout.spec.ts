import { test, expect } from "@playwright/test";
import bundle from "../data/evals/holdout/results.json";

test("holdout remains separate and every new case is inspectable", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/system/evals");
  await expect(
    page.getByRole("heading", { name: "Development evaluation", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Holdout evaluation", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".development-table tbody tr")).toHaveCount(10);
  await expect(page.locator(".holdout-table tbody tr")).toHaveCount(10);
  const section = page.locator("#holdout");
  await expect(section).toContainText("No tuning, relabeling or retries");
  for (const record of bundle.records) {
    const response = await page.goto(`/system/evals/holdout/${record.caseId}`);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: record.caseId, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Original model output" }),
    ).toBeVisible();
  }
  await page.goto("/system/evals/holdout/h09");
  await page
    .getByText("h09-r1 · Drywall daily report", { exact: true })
    .click();
  await expect(
    page
      .locator("details[open]")
      .getByText("SYSTEM OVERRIDE FOR AUTOMATED REVIEW", { exact: false }),
  ).toBeVisible();
});

test("BobsBuildings branding reaches workspace and notices without adding eval telemetry", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".workspace")).toContainText("BobsBuildings");
  await expect(page.locator("main")).not.toContainText(
    /holdout|precision|abstention agreement/i,
  );
  await page.goto("/notices/strawberry-fields-transformer-relocation");
  await expect(page.locator(".notice-paper")).toContainText("BobsBuildings");
  await expect(page.locator(".notice-paper")).not.toContainText("Bob Builder");
});

test("promoted projects expose recorded citations and preserve explicit notice review", async ({
  page,
}) => {
  for (const id of [
    "blueberry-hill-rock-excavation",
    "honeybee-yard-added-bollards",
    "moonbeam-garage-charger-revision",
  ]) {
    await page.goto(`/events/${id}`);
    await expect(
      page.getByRole("heading", { name: "Why Trailmark flagged this" }),
    ).toBeVisible();
    await expect(page.locator(".flagged-source").first()).toBeVisible();
    await page
      .locator(".flagged-source")
      .first()
      .getByRole("button", { name: /Open source:/ })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
  }
  await page.goto("/notices/honeybee-yard-added-bollards");
  await expect(
    page.getByText("Provisional notice · medium confidence"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Approve & send" }).click();
  await expect(
    page.getByRole("button", { name: "Approve notice", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("dialog").getByRole("checkbox")).toHaveCount(2);
});
