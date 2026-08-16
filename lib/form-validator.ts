// lib/form-validator.ts

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  customValidator?: (value: string) => string | null;
}

export interface FieldValidationConfig {
  id: string;
  label: string;
  type?: "text" | "textarea" | "select" | "url" | "keyword";
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstErrorFieldId?: string;
}

export interface CsvKeywordParseResult {
  keywords: string[];
  duplicates: string[];
  invalidTokens: string[];
  isValid: boolean;
  errorMessage?: string;
}

export class FormValidator {
  /**
   * Validates a single value against given rules and returns a clear, actionable error message or null.
   */
  public static validateField(
    value: string | undefined | null,
    rules: ValidationRule,
    fieldLabel: string = "This field"
  ): string | null {
    const trimmed = (value ?? "").trim();

    // 1. Required Check
    if (rules.required && trimmed.length === 0) {
      return `${fieldLabel} is required and cannot be left blank.`;
    }

    // If field is empty and not required, no further checks needed
    if (trimmed.length === 0) {
      return null;
    }

    // 2. Minimum Length Check
    if (rules.minLength !== undefined && trimmed.length < rules.minLength) {
      return `${fieldLabel} must be at least ${rules.minLength} characters (currently ${trimmed.length}).`;
    }

    // 3. Maximum Length Check
    if (rules.maxLength !== undefined && trimmed.length > rules.maxLength) {
      return `${fieldLabel} must not exceed ${rules.maxLength} characters (currently ${trimmed.length}).`;
    }

    // 4. Regex Pattern Check
    if (rules.pattern && !rules.pattern.test(trimmed)) {
      return rules.patternMessage || `${fieldLabel} format is invalid.`;
    }

    // 5. Custom Validator Check
    if (rules.customValidator) {
      const customErr = rules.customValidator(trimmed);
      if (customErr) return customErr;
    }

    return null;
  }

  /**
   * Validates keyword string inputs for quality, length, and valid characters.
   */
  public static validateKeyword(keyword: string): string | null {
    const trimmed = (keyword ?? "").trim();
    if (!trimmed) {
      return "Keyword cannot be empty.";
    }
    if (trimmed.length < 2) {
      return "Keyword must be at least 2 characters.";
    }
    if (trimmed.length > 100) {
      return "Keyword cannot exceed 100 characters.";
    }
    // Disallow control characters or script injection tags
    if (/[<>{}]/g.test(trimmed)) {
      return "Keyword contains invalid special characters (<, >, {, }).";
    }
    return null;
  }

  /**
   * Parses free-form comma-separated keyword entries with whitespace trimming,
   * duplicate detection, token validation, and error reporting.
   */
  public static parseCsvKeywords(rawInput: string): CsvKeywordParseResult {
    if (!rawInput || !rawInput.trim()) {
      return {
        keywords: [],
        duplicates: [],
        invalidTokens: [],
        isValid: true,
      };
    }

    const rawTokens = rawInput
      .split(/,|\n/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const seen = new Set<string>();
    const keywords: string[] = [];
    const duplicates: string[] = [];
    const invalidTokens: string[] = [];

    for (const token of rawTokens) {
      const lower = token.toLowerCase();
      const err = this.validateKeyword(token);

      if (err) {
        invalidTokens.push(token);
        continue;
      }

      if (seen.has(lower)) {
        duplicates.push(token);
      } else {
        seen.add(lower);
        keywords.push(token);
      }
    }

    let errorMessage: string | undefined;
    if (invalidTokens.length > 0) {
      errorMessage = `${invalidTokens.length} keyword(s) failed validation: "${invalidTokens.slice(0, 2).join('", "')}".`;
    }

    return {
      keywords,
      duplicates,
      invalidTokens,
      isValid: invalidTokens.length === 0,
      errorMessage,
    };
  }

  /**
   * Validates search query strings.
   */
  public static validateSearchQuery(query: string): string | null {
    const trimmed = (query ?? "").trim();
    if (trimmed.length > 200) {
      return "Search query cannot exceed 200 characters.";
    }
    if (/[<>{}]/g.test(trimmed)) {
      return "Search query contains invalid characters.";
    }
    return null;
  }

  /**
   * Validates URL format if provided.
   */
  public static validateUrl(url: string, isRequired: boolean = false): string | null {
    const trimmed = (url ?? "").trim();
    if (!trimmed) {
      if (isRequired) return "Website URL is required.";
      return null;
    }
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    if (!urlPattern.test(trimmed)) {
      return "Please enter a valid website URL (e.g., https://example.com).";
    }
    return null;
  }

  /**
   * Validates a batch of fields for a deliverable subtype form.
   */
  public static validateFormFields(
    fieldDefs: FieldValidationConfig[],
    values: Record<string, string>
  ): ValidationResult {
    const errors: Record<string, string> = {};
    let firstErrorFieldId: string | undefined;

    for (const field of fieldDefs) {
      const val = values[field.id] || "";
      const isRequired = field.required !== false;
      const minLength = field.minLength || (isRequired ? 2 : undefined);
      const maxLength = field.maxLength || (field.type === "textarea" ? 1500 : 300);

      const err = this.validateField(
        val,
        {
          required: isRequired,
          minLength,
          maxLength,
        },
        field.label
      );

      if (err) {
        errors[field.id] = err;
        if (!firstErrorFieldId) firstErrorFieldId = field.id;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      firstErrorFieldId,
    };
  }

  /**
   * Accessible ARIA attributes helper for invalid fields.
   */
  public static getAriaAttributes(fieldId: string, errorMessage?: string) {
    if (!errorMessage) {
      return {
        "aria-invalid": false,
      };
    }
    return {
      "aria-invalid": true,
      "aria-describedby": `${fieldId}-error`,
    };
  }
}
