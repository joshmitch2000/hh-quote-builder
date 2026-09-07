import { test, expect } from "@playwright/test";

/**
 * Live-site E2E against https://himandhermusic.com/wedding-music-packages/.
 * Selector strategy: state-first (store values, hidden-field values,
 * counts) rather than pixel layout, so the tests survive Elementor/theme
 * markup changes.
 *
 * Test 1 asserts v1.2.0 behavior (style pre-selected on load) and FAILS
 * against any older deploy — the suite doubles as a deploy check.
 * Catalog values (coverage/style slugs) are read from the live store, not
 * hardcoded, so ACF/content changes don't break the suite.
 *
 * Package selection is driven via store.selectPackage() rather than a
 * button click because clicking also fires HHQuoteNav step navigation
 * (orthogonal to what's asserted here).
 */
test.describe("quote builder (live)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/wedding-music-packages/");
    // Store is bound once coverage carries a real slug (payload applied).
    await page.waitForFunction(() => window.Alpine?.store("quote")?.coverage);
  });

  test("pre-selects default coverage and first valid style on load", async ({
    page,
  }) => {
    const state = await page.evaluate(() => ({
      coverage: window.Alpine.store("quote").coverage,
      style: window.Alpine.store("quote").style,
      styleLabel: window.Alpine.store("quote").styleLabel,
    }));
    expect(state.coverage).toBeTruthy();
    expect(state.style).toBeTruthy(); // v1.2.0: style is pre-selected
    expect(state.styleLabel).toBe("Acoustic/strings only");

    // Cards render immediately; the empty-state placeholder stays hidden.
    await expect(page.locator("#cards .package-card").first()).toBeVisible();
    await expect(page.locator("#cards .placeholder")).toBeHidden();

    // The checked style radio matches the store.
    await expect(page.locator('input[name="style-filter"]:checked')).toHaveValue(
      state.style,
    );
  });

  test("snaps to first valid style when coverage change invalidates the current style", async ({
    page,
  }) => {
    const snap = await page.evaluate(() => {
      const store = window.Alpine.store("quote");
      const startStyle = store.style;

      // A coverage where the current style is NOT valid but some style IS.
      const targetCoverage = store.availableCoverage.find(
        (cov) =>
          !store.styleToCoverages[startStyle]?.includes(cov) &&
          Object.values(store.styleToCoverages).some((covs) =>
            covs.includes(cov),
          ),
      );
      if (!targetCoverage) return null;

      const expectedFirstValid = Object.keys(store.styleToCoverages).find(
        (style) => store.styleToCoverages[style].includes(targetCoverage),
      );
      return { targetCoverage, expectedFirstValid };
    });

    test.skip(!snap, "every coverage supports the default style — nothing to snap");

    // Change coverage via the real UI radio (the user's path).
    await page
      .locator(`input[name="coverage-filter"][value="${snap.targetCoverage}"]`)
      .check();

    // Style snaps to the first valid option for the new coverage…
    await expect
      .poll(() => page.evaluate(() => window.Alpine.store("quote").style))
      .toBe(snap.expectedFirstValid);

    // …the checked radio follows…
    await expect(page.locator('input[name="style-filter"]:checked')).toHaveValue(
      snap.expectedFirstValid,
    );

    // …and cards re-render for the new combination.
    await expect(page.locator("#cards .package-card").first()).toBeVisible();
  });

  test("package selection populates add-ons and syncs the Elementor hidden fields", async ({
    page,
  }) => {
    await expect(page.locator("#cards .package-card").first()).toBeVisible();

    const expected = await page.evaluate(() => {
      const store = window.Alpine.store("quote");
      store.selectPackage(store.visiblePackages[0]);
      return {
        coverage: store.coverage,
        style: store.style,
        label: store.selectedPackage?.label,
        basePrice: String(store.selectedPackage?.price ?? ""),
        total: String(store.total),
        addonCount: store.selectedPackage?.addons.length ?? 0,
      };
    });
    expect(expected.label).toBeTruthy();

    await expect(
      page.locator('input[name="form_fields[selected_coverage]"]'),
    ).toHaveValue(expected.coverage);
    await expect(
      page.locator('input[name="form_fields[selected_style]"]'),
    ).toHaveValue(expected.style);
    await expect(
      page.locator('input[name="form_fields[package_name]"]'),
    ).toHaveValue(expected.label);
    await expect(
      page.locator('input[name="form_fields[base_price]"]'),
    ).toHaveValue(expected.basePrice);
    await expect(
      page.locator('input[name="form_fields[estimated_total]"]'),
    ).toHaveValue(expected.total);

    if (expected.addonCount > 0) {
      await expect(page.locator(".addons-selected-package")).toHaveText(
        expected.label,
      );
      await expect(page.locator("#addons-container .addon-row")).toHaveCount(
        expected.addonCount,
      );
    }
  });
});
