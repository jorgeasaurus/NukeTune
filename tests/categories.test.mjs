import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DELETION_ORDER, getDeletionRank } from "../src/lib/intune/deletionOrder.js";
import { getProtectionReason } from "../src/lib/intune/protection.js";

// categories.ts is TypeScript with a path alias, so parse the catalogue
// textually: one `{ ... }` object per category inside INTUNE_CATEGORIES.
async function loadCategories() {
  const source = await readFile(new URL("../src/lib/intune/categories.ts", import.meta.url), "utf8");
  const body = source.slice(source.indexOf("INTUNE_CATEGORIES"), source.indexOf("\n];"));
  const blocks = body.split(/\n {2}\{\n/).slice(1);
  return blocks.map((block) => {
    const field = (name) => block.match(new RegExp(`^\\s{4}${name}: "([^"]*)"`, "m"))?.[1];
    const flag = (name) => block.match(new RegExp(`^\\s{4}${name}: (true|false)`, "m"))?.[1];
    return {
      id: field("id"),
      name: field("name"),
      description: field("description"),
      dangerLevel: field("dangerLevel"),
      listEndpoint: field("listEndpoint"),
      deleteEndpoint: field("deleteEndpoint"),
      useBeta: flag("useBeta"),
    };
  });
}

test("every category is well-formed, unique and in the deletion order", async () => {
  const categories = await loadCategories();
  assert.ok(categories.length >= 39, `parsed ${categories.length} categories`);

  const ids = categories.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "category ids are unique");
  const names = categories.map((c) => c.name);
  assert.equal(new Set(names).size, names.length, "category names are unique");

  for (const c of categories) {
    assert.ok(c.id && c.name && c.description, `${c.id} has id, name and description`);
    assert.ok(["low", "medium", "high", "critical"].includes(c.dangerLevel), `${c.id} danger level`);
    assert.ok(c.listEndpoint?.startsWith("/"), `${c.id} listEndpoint starts with /`);
    assert.ok(c.deleteEndpoint?.startsWith("/"), `${c.id} deleteEndpoint starts with /`);
    assert.ok(!c.listEndpoint.includes("?"), `${c.id} puts query options in filter, not the path`);
    assert.ok(c.useBeta === "true" || c.useBeta === "false", `${c.id} declares useBeta`);
    assert.ok(DELETION_ORDER.includes(c.id), `${c.id} is in DELETION_ORDER`);
    assert.ok(!/Azure AD/.test(`${c.name} ${c.description}`), `${c.id} says Microsoft Entra, not Azure AD`);
  }

  // Nothing in the deletion order that is not a real category.
  assert.deepEqual(DELETION_ORDER.filter((id) => !ids.includes(id)), []);
});

test("new categories use the documented Graph endpoints", async () => {
  const byId = Object.fromEntries((await loadCategories()).map((c) => [c.id, c]));
  const expected = {
    "feature-update-profiles": "/deviceManagement/windowsFeatureUpdateProfiles",
    "quality-update-profiles": "/deviceManagement/windowsQualityUpdateProfiles",
    "quality-update-policies": "/deviceManagement/windowsQualityUpdatePolicies",
    "driver-update-profiles": "/deviceManagement/windowsDriverUpdateProfiles",
    "app-protection-windows-mam": "/deviceAppManagement/windowsManagedAppProtections",
    "app-protection-windows": "/deviceAppManagement/windowsInformationProtectionPolicies",
    "wip-mdm-policies": "/deviceAppManagement/mdmWindowsInformationProtectionPolicies",
    "managed-app-configurations": "/deviceAppManagement/targetedManagedAppConfigurations",
    "policy-sets": "/deviceAppManagement/policySets",
    "reusable-policy-settings": "/deviceManagement/reusablePolicySettings",
    "compliance-scripts": "/deviceManagement/deviceComplianceScripts",
    "branding-profiles": "/deviceManagement/intuneBrandingProfiles",
  };
  for (const [id, endpoint] of Object.entries(expected)) {
    assert.ok(byId[id], `${id} exists`);
    assert.equal(byId[id].listEndpoint, endpoint, `${id} list`);
    assert.equal(byId[id].deleteEndpoint, endpoint, `${id} delete`);
    // These collections are only in the beta Graph schema the sources cover.
    assert.equal(byId[id].useBeta, "true", `${id} uses beta`);
  }

  assert.match(byId["app-protection-windows"].name, /legacy/i);
  assert.match(byId["wip-mdm-policies"].name, /legacy/i);
  assert.match(byId["security-baselines"].description, /endpoint security/i);
});

test("deletion order puts dependents before what they reference", () => {
  const before = (a, b) => assert.ok(getDeletionRank(a) < getDeletionRank(b), `${a} before ${b}`);

  // Policy sets bundle apps, policies and profiles.
  for (const bundled of [
    "mobile-apps",
    "app-configurations",
    "managed-app-configurations",
    "app-protection-ios",
    "app-protection-android",
    "app-protection-windows-mam",
    "device-configurations",
    "configuration-policies",
    "compliance-policies",
    "autopilot-profiles",
    "enrollment-configurations",
  ]) {
    before("policy-sets", bundled);
  }

  // Managed-app policies before the apps they target.
  for (const appPolicy of [
    "managed-app-configurations",
    "app-protection-windows-mam",
    "app-protection-windows",
    "wip-mdm-policies",
  ]) {
    before(appPolicy, "mobile-apps");
  }

  // Compliance policies reference compliance scripts.
  before("compliance-policies", "compliance-scripts");
  before("compliance-policies-v2", "compliance-scripts");

  // Settings Catalog and intents reference reusable settings.
  before("configuration-policies", "reusable-policy-settings");
  before("security-baselines", "reusable-policy-settings");

  // Everything new is assigned to groups / filters / scope tags.
  for (const id of [
    "policy-sets",
    "managed-app-configurations",
    "app-protection-windows-mam",
    "wip-mdm-policies",
    "compliance-scripts",
    "reusable-policy-settings",
    "feature-update-profiles",
    "quality-update-profiles",
    "quality-update-policies",
    "driver-update-profiles",
    "branding-profiles",
  ]) {
    before(id, "assignment-filters");
    before(id, "entra-groups");
    before(id, "scope-tags");
  }
});

test("the default branding profile is protected", () => {
  assert.equal(
    getProtectionReason("branding-profiles", { id: "b0", profileName: "Contoso", isDefaultProfile: true }),
    "Default branding profile",
  );
  assert.equal(
    getProtectionReason("branding-profiles", { id: "b1", displayName: "Contoso Sales", isDefaultProfile: false }),
    null,
  );
  assert.equal(getProtectionReason("branding-profiles", { id: "b2", displayName: "Contoso Sales" }), null);
  // The flag is only meaningful for branding profiles.
  assert.equal(
    getProtectionReason("policy-sets", { id: "p", displayName: "Baseline set", isDefaultProfile: true }),
    null,
  );
});
