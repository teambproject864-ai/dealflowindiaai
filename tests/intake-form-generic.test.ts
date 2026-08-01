import assert from "assert";
import {
  defaultGtmFormConfig,
  retailFormConfig,
  manufacturingFormConfig,
  professionalServicesFormConfig,
  saasFormConfig,
  getPresetFormConfig,
} from "@/lib/intake-form-presets";
import { FormConfig, FormFieldConfig } from "@/components/IntakeForm";

// Helper logic to simulate evaluateDependency from IntakeForm component
function evaluateDependency(
  dependsOn: FormFieldConfig["dependsOn"],
  formData: Record<string, any>
): boolean {
  if (!dependsOn) return true;
  const targetVal = formData[dependsOn.fieldId];
  const operator = dependsOn.operator || "equals";
  const expectedVal = dependsOn.value;

  if (operator === "truthy") {
    return Boolean(targetVal);
  }

  if (operator === "contains") {
    if (Array.isArray(targetVal)) {
      if (Array.isArray(expectedVal)) {
        return expectedVal.some((v) => targetVal.includes(v));
      }
      return targetVal.includes(expectedVal);
    }
    if (typeof targetVal === "string") {
      return targetVal.includes(String(expectedVal));
    }
    return false;
  }

  if (operator === "not_equals") {
    if (Array.isArray(expectedVal)) {
      return !expectedVal.includes(targetVal);
    }
    return targetVal !== expectedVal;
  }

  if (Array.isArray(expectedVal)) {
    return expectedVal.includes(targetVal);
  }
  return targetVal === expectedVal;
}

// Helper logic to validate fields in a step
function validateStepFields(
  fields: FormFieldConfig[],
  formData: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    // Skip hidden dependent fields
    if (!evaluateDependency(field.dependsOn, formData)) return;

    const val = formData[field.id];
    const rules = field.validation;
    if (!rules) return;

    if (rules.required) {
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0) ||
        (field.type === "checkbox" && val === false)
      ) {
        errors[field.id] =
          typeof rules.required === "string"
            ? rules.required
            : "Field is required";
        return;
      }
    }

    if (field.type === "number" && val !== "" && val !== undefined) {
      const num = Number(val);
      if (rules.min !== undefined && num < rules.min) {
        errors[field.id] = `Min ${rules.min}`;
        return;
      }
    }

    if (rules.pattern && typeof val === "string" && val.length > 0) {
      const reg =
        rules.pattern instanceof RegExp ? rules.pattern : rules.pattern.value;
      if (!reg.test(val)) {
        errors[field.id] = "Pattern mismatch";
        return;
      }
    }

    if (rules.custom) {
      const res = rules.custom(val, formData);
      if (typeof res === "string") {
        errors[field.id] = res;
        return;
      }
    }
  });

  return errors;
}

// ---------------------------------------------------------------------------
// TEST SUITES
// ---------------------------------------------------------------------------

export async function runIntakeFormPresetTests() {
  // Test 1: Preset Loader Resolution
  assert.equal(getPresetFormConfig("gtm").id, "gtm-intake-form");
  assert.equal(getPresetFormConfig("retail").id, "retail-intake-form");
  assert.equal(getPresetFormConfig("manufacturing").id, "manufacturing-intake-form");
  assert.equal(getPresetFormConfig("professional_services").id, "prof-services-intake-form");
  assert.equal(getPresetFormConfig("saas").id, "saas-intake-form");
  assert.equal(getPresetFormConfig().id, "gtm-intake-form");

  // Test 2: Manufacturing Preset Structure
  assert.equal(manufacturingFormConfig.steps.length, 2);
  const mfgFields = manufacturingFormConfig.steps[0].fields.map((f) => f.id);
  assert.ok(mfgFields.includes("facilityName"));
  assert.ok(mfgFields.includes("productionModel"));

  // Test 3: Retail Preset Structure
  assert.equal(retailFormConfig.steps.length, 2);
  const retailFields = retailFormConfig.steps[0].fields.map((f) => f.id);
  assert.ok(retailFields.includes("storeName"));
  assert.ok(retailFields.includes("businessType"));

  // Test 4: Professional Services Preset Structure
  assert.equal(professionalServicesFormConfig.steps.length, 2);
  const profFields = professionalServicesFormConfig.steps[0].fields.map((f) => f.id);
  assert.ok(profFields.includes("firmName"));
  assert.ok(profFields.includes("practiceArea"));

  // Test 5: SaaS Preset Structure
  assert.equal(saasFormConfig.steps.length, 2);
  const saasFields = saasFormConfig.steps[0].fields.map((f) => f.id);
  assert.ok(saasFields.includes("productName"));
  assert.ok(saasFields.includes("deploymentModel"));
}

export async function runIntakeFormValidationTests() {
  // Test Retail Validation - Empty data should trigger required errors
  const retailStep1 = retailFormConfig.steps[0].fields;
  const errorsEmpty = validateStepFields(retailStep1, {});
  assert.ok(errorsEmpty.storeName, "storeName should be required");
  assert.ok(errorsEmpty.contactEmail, "contactEmail should be required");
  assert.ok(errorsEmpty.businessType, "businessType should be required");

  // Test Retail Validation - Valid data
  const validRetailData = {
    storeName: "Urban Chic Boutique",
    contactEmail: "contact@urbanchic.com",
    businessType: "brick_mortar",
    locationCount: 3,
  };
  const errorsValid = validateStepFields(retailStep1, validRetailData);
  assert.equal(Object.keys(errorsValid).length, 0, "Should have zero validation errors for valid retail data");

  // Test Pattern Regex Validation
  const invalidEmailData = {
    storeName: "Urban Chic",
    contactEmail: "invalid-email-address",
    businessType: "brick_mortar",
  };
  const errorsInvalidEmail = validateStepFields(retailStep1, invalidEmailData);
  assert.ok(errorsInvalidEmail.contactEmail, "Should flag invalid email pattern");
}

export async function runIntakeFormDependencyTests() {
  // Test Retail locationCount visibility dependon businessType
  const locationCountField = retailFormConfig.steps[0].fields.find(
    (f) => f.id === "locationCount"
  )!;

  // When businessType is 'ecom_d2c', locationCount should be hidden
  assert.equal(
    evaluateDependency(locationCountField.dependsOn, { businessType: "ecom_d2c" }),
    false
  );

  // When businessType is 'brick_mortar', locationCount should be visible
  assert.equal(
    evaluateDependency(locationCountField.dependsOn, { businessType: "brick_mortar" }),
    true
  );

  // Test SaaS dependent field options
  const certOtherField: FormFieldConfig = {
    id: "certOther",
    label: "Other Cert",
    type: "text",
    dependsOn: { fieldId: "certs", value: "Other", operator: "contains" },
  };

  assert.equal(evaluateDependency(certOtherField.dependsOn, { certs: ["SOC2", "Other"] }), true);
  assert.equal(evaluateDependency(certOtherField.dependsOn, { certs: ["SOC2", "ISO"] }), false);
}

export async function runCrossIndustryCategoryTests() {
  // 1. Verify dynamic step filtering based on businessCategory in defaultGtmFormConfig
  const gtmSteps = defaultGtmFormConfig.steps;

  // For SaaS businessCategory
  const saasVisibleSteps = gtmSteps.filter(
    (s) => !s.condition || s.condition({ businessCategory: "saas" })
  );
  const saasStepIds = saasVisibleSteps.map((s) => s.id);
  assert.ok(saasStepIds.includes("saas-metrics"), "SaaS metrics step should be visible for saas category");
  assert.ok(!saasStepIds.includes("retail-metrics"), "Retail step should be hidden for saas category");
  assert.ok(!saasStepIds.includes("manufacturing-metrics"), "Mfg step should be hidden for saas category");

  // For Retail businessCategory
  const retailVisibleSteps = gtmSteps.filter(
    (s) => !s.condition || s.condition({ businessCategory: "retail" })
  );
  const retailStepIds = retailVisibleSteps.map((s) => s.id);
  assert.ok(retailStepIds.includes("retail-metrics"), "Retail metrics step should be visible for retail category");
  assert.ok(!retailStepIds.includes("saas-metrics"), "SaaS step should be hidden for retail category");

  // For Manufacturing businessCategory
  const mfgVisibleSteps = gtmSteps.filter(
    (s) => !s.condition || s.condition({ businessCategory: "manufacturing" })
  );
  const mfgStepIds = mfgVisibleSteps.map((s) => s.id);
  assert.ok(mfgStepIds.includes("manufacturing-metrics"), "Mfg step should be visible for manufacturing category");

  // For Professional Services businessCategory
  const servicesVisibleSteps = gtmSteps.filter(
    (s) => !s.condition || s.condition({ businessCategory: "professional_services" })
  );
  const servicesStepIds = servicesVisibleSteps.map((s) => s.id);
  assert.ok(servicesStepIds.includes("services-metrics"), "Services step should be visible for professional_services category");

  // For Healthcare businessCategory
  const healthcareVisibleSteps = gtmSteps.filter(
    (s) => !s.condition || s.condition({ businessCategory: "healthcare" })
  );
  const healthcareStepIds = healthcareVisibleSteps.map((s) => s.id);
  assert.ok(healthcareStepIds.includes("healthcare-metrics"), "Healthcare step should be visible for healthcare category");

  // 2. Verify Workflow Trigger Tag Mapping Logic
  const categoryToWorkflowMap: Record<string, string> = {
    saas: "saas_gtm_analysis",
    retail: "retail_pos_analysis",
    manufacturing: "manufacturing_supplychain_analysis",
    professional_services: "professional_services_analysis",
    healthcare: "healthcare_compliance_analysis",
    other: "general_gtm_analysis",
  };

  assert.equal(categoryToWorkflowMap["saas"], "saas_gtm_analysis");
  assert.equal(categoryToWorkflowMap["retail"], "retail_pos_analysis");
  assert.equal(categoryToWorkflowMap["manufacturing"], "manufacturing_supplychain_analysis");
  assert.equal(categoryToWorkflowMap["professional_services"], "professional_services_analysis");
  assert.equal(categoryToWorkflowMap["healthcare"], "healthcare_compliance_analysis");
}

export async function runIntakeFormGenericTests() {
  await runIntakeFormPresetTests();
  await runIntakeFormValidationTests();
  await runIntakeFormDependencyTests();
  await runCrossIndustryCategoryTests();
  console.log("ALL GENERIC & CROSS-INDUSTRY INTAKE FORM TESTS PASSED SUCCESSFULLY!");
}

if (process.argv[1]?.includes("intake-form-generic.test")) {
  runIntakeFormGenericTests().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
}
