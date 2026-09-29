import { test, expect } from "@playwright/test";
import bundle from "../data/evals/phase3-results.json";

test("evaluation shows measured components and preserves every partial failure", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/system/evals");
  await expect(
    page.getByRole("heading", { name: "Detection evaluation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Authored synthetic evaluation ground truth",
      level: 2,
    }),
  ).toBeVisible();
  await expect(page.locator(".development-table tbody tr")).toHaveCount(
    bundle.records.length,
  );
  await expect(
    page.locator(".eval-metric").filter({
      has: page.getByRole("heading", {
        name: "Abstention accuracy",
        exact: true,
      }),
    }),
  ).toContainText("60.0%");
  await expect(
    page
      .locator(".development-table tbody tr")
      .filter({ hasText: "unrelated-records" }),
  ).toContainText("unexpected evidence");
  await page
    .getByRole("link", { name: "unrelated-records", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Original model output" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Prototype expectations, not legal or construction-domain truth.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("unrelated-records-2 · body", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("every recorded case is inspectable and PM pages contain no eval telemetry", async ({
  page,
}) => {
  for (const record of bundle.records) {
    const response = await page.goto(`/system/evals/${record.caseId}`);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: record.caseId, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Supplied source records" }),
    ).toBeVisible();
  }
  for (const route of [
    "/",
    "/events/strawberry-fields-transformer-relocation",
    "/notices/strawberry-fields-transformer-relocation",
  ]) {
    await page.goto(route);
    await expect(page.locator("main")).not.toContainText(
      /precision|token counts|schema.validation|eval cases|abstention accuracy/i,
    );
  }
  await page.goto("/system/evals/not-a-case");
  await expect(
    page.getByRole("heading", { name: "This trail ends here." }),
  ).toBeVisible();
});

test("technical evaluation table scrolls within the mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/system/evals");
  await expect(
    page.getByRole("heading", { name: "Detection evaluation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
