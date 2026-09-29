import { expect, test } from "@playwright/test";

const hero = "strawberry-fields-transformer-relocation";

test("overview connects to evidence, editable notice, approval, and persisted portfolio totals", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good morning, Jordan." }),
  ).toBeVisible();
  await expect(page.locator(".event-card")).toHaveCount(5);
  await expect(page.locator(".exposure-card .metric-value")).toContainText(
    "$71.8K",
  );
  await page
    .locator(".event-card")
    .first()
    .getByRole("link", { name: "Review change" })
    .click();
  await expect(page).toHaveURL(`/events/${hero}`);
  await expect(
    page.getByRole("heading", { name: "Evidence timeline" }),
  ).toBeVisible();
  await expect(page.locator(".timeline-item")).toHaveCount(4);
  await page.getByRole("button", { name: /Utility email received/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "please relocate the charger islands",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("link", { name: "Review notice" }).click();
  await expect(page).toHaveURL(`/notices/${hero}`);
  await expect(page.locator(".letter-body")).toContainText("$18,420");
  await expect(page.locator(".letter-body")).toContainText(
    "reserves all rights",
  );
  await page.getByRole("button", { name: "Edit draft" }).click();
  const original = await page
    .getByRole("textbox", { name: "Notice body" })
    .inputValue();
  await page
    .getByRole("textbox", { name: "Notice body" })
    .fill(
      original.replace(
        "Dear Morgan,",
        "Dear Morgan,\n\nPlease see the verified field records attached to this review.",
      ),
    );
  await page.getByRole("button", { name: "Save for later" }).click();
  await page.reload();
  await expect(page.locator(".letter-body")).toContainText(
    "verified field records",
  );
  await page.getByRole("button", { name: "Approve & send" }).click();
  await expect(page.getByRole("dialog")).toContainText("no email will be sent");
  await page.getByRole("button", { name: "Confirm demo send" }).click();
  await expect(
    page.getByRole("heading", { name: "Notice approved" }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".exposure-card .metric-value")).toContainText(
    "$71.8K",
  );
  await expect(page.locator(".event-card").first()).toContainText(
    "Notice sent · demo",
  );
  await expect(page.locator(".event-card")).toHaveCount(5);
  expect(errors).toEqual([]);
});

test("filters, sorting, global search, and sidebar routes work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ready for notice" }).click();
  await expect(page.locator(".event-card")).toHaveCount(1);
  await expect(page.locator(".event-card")).toContainText("Honeybee Yard");
  await page.getByRole("button", { name: "All changes" }).click();
  await page.getByLabel("Sort change events").selectOption("exposure");
  await expect(page.locator(".event-card").first()).toContainText(
    "Blueberry Hill",
  );
  await page
    .getByLabel("Filter overview by project")
    .selectOption("clover-court");
  await expect(page.locator(".event-card")).toHaveCount(1);
  await expect(page.locator(".exposure-card .metric-value")).toContainText(
    "$11.3K",
  );
  await page.getByLabel("Filter overview by project").selectOption("all");
  await page.getByRole("button", { name: "Search workspace" }).click();
  await page
    .getByPlaceholder("Search projects, changes, or evidence...")
    .fill("transformer");
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /Transformer relocation/ })
    .click();
  await expect(page).toHaveURL(`/events/${hero}`);
  for (const route of [
    "Projects",
    "Notices",
    "Evidence",
    "Change events",
    "Overview",
  ]) {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: route })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await page.getByRole("link", { name: /Notice due <24h/ }).click();
  await expect(page.locator(".event-card")).toHaveCount(2);
  await expect(page.locator(".event-card").first()).toContainText(
    "Honeybee Yard",
  );
});

test("insufficient evidence abstains, clarification is saved, dismissal can be undone", async ({
  page,
}) => {
  await page.goto("/events/clover-court-conduit-reroute");
  await expect(
    page.getByText("Trailmark has not drafted a notice", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Review notice" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Request clarification" }).click();
  await page
    .getByRole("button", { name: "Save clarification request" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Clarification requested in demo",
  );
  await page.reload();
  await expect(page.getByRole("status")).toContainText(
    "Clarification requested in demo",
  );
  await page
    .getByRole("button", { name: "Mark not a change", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mark not a change", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Marked as not a change",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Request clarification" }),
  ).toBeVisible();
});

test("source records open from the evidence library and unknown records show the not-found view", async ({
  page,
}) => {
  await page.goto("/evidence?item=sf-email");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Chris Patel");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByLabel("Filter evidence by project")
    .selectOption("strawberry-fields");
  await expect(page.locator(".evidence-library-card")).toHaveCount(4);
  await page.getByLabel("Search evidence").fill("rfi");
  await expect(page.locator(".evidence-library-card")).toHaveCount(1);
  await page.goto("/events/not-a-real-event");
  await expect(
    page.getByRole("heading", { name: "This trail ends here." }),
  ).toBeVisible();
});

test("mobile layout has no page overflow and navigation reaches the notice flow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Change events" })
    .click();
  await page
    .locator(".event-card")
    .first()
    .getByRole("link", { name: "Review change" })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Review notice" }).click();
  await expect(
    page.getByRole("button", { name: "Approve & send" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
