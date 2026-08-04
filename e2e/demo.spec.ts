import { expect, test } from "@playwright/test";

test("runs a transparent production-shaped brief workflow", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Signalbrief — Walk into every call ready");
  await expect(page.getByRole("heading", { name: "Run the brief pipeline" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Star on GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/mherzog4/signalbrief",
  );

  const brokenHashTargets = await page.locator('a[href^="#"]').evaluateAll((links) => links
    .map((link) => link.getAttribute("href"))
    .filter((href): href is string => Boolean(href && href.length > 1 && !document.querySelector(href))));
  expect(brokenHashTargets).toEqual([]);

  await page.getByRole("button", { name: "Northstar Technical validation" }).click();
  await page.getByRole("button", { name: "Generate brief" }).click();

  await expect(page.getByRole("heading", { name: "Pipeline completed" })).toBeVisible();
  await expect(page.getByText("Curated fixture", { exact: true })).toBeVisible();
  await expect(page.getByText(/5 records · run/)).toBeVisible();
  await expect(page.getByText(/Gong, HubSpot, and public records are synthetic/)).toBeVisible();
  await expect(page.getByText("$240k new-logo opportunity", { exact: true })).toBeVisible();
});
