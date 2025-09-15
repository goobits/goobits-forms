/**
 * Contact form schema definitions and validation
 *
 * Provides standardized schemas for categorized contact forms
 * with validation and configuration utilities.
 */

import { secureDeepMerge } from "./secureDeepMerge.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("ContactSchemas");

/**
 * Default field configurations
 */
export const defaultFieldConfigs = {
  name: {
    type: "text",
    label: "Name",
    placeholder: "Your name",
    required: true,
    maxlength: 100,
  },
  email: {
    type: "email",
    label: "Email",
    placeholder: "your@email.com",
    required: true,
    maxlength: 150,
  },
  phone: {
    type: "tel",
    label: "Phone",
    placeholder: "Your phone number (optional)",
    required: false,
    maxlength: 20,
  },
  message: {
    type: "textarea",
    label: "Message",
    placeholder: "Your message",
    required: true,
    maxlength: 2000,
    rows: 5,
  },
  subject: {
    type: "text",
    label: "Subject",
    placeholder: "Subject of your message",
    required: false,
    maxlength: 200,
  },
  company: {
    type: "text",
    label: "Company",
    placeholder: "Your company name",
    required: false,
    maxlength: 150,
  },
  website: {
    type: "url",
    label: "Website",
    placeholder: "https://yourwebsite.com",
    required: false,
    maxlength: 200,
  },
  industry: {
    type: "text",
    label: "Industry",
    placeholder: "Your industry",
    required: false,
    maxlength: 100,
  },
  role: {
    type: "text",
    label: "Your Role",
    placeholder: "Your position or role",
    required: false,
    maxlength: 100,
  },
  operatingSystem: {
    type: "text",
    label: "Operating System",
    placeholder: "e.g., Windows, macOS, Linux, iOS, Android",
    required: false,
    maxlength: 100,
  },
  browser: {
    type: "text",
    label: "Browser",
    placeholder: "e.g., Chrome, Firefox, Safari, Edge",
    required: false,
    maxlength: 100,
  },
  browserVersion: {
    type: "text",
    label: "Browser Version",
    placeholder: "e.g., 15.0",
    required: false,
    maxlength: 50,
  },
  attachments: {
    type: "file",
    label: "Attachments",
    required: false,
    multiple: true,
    accept: "image/*,.pdf,.doc,.docx,.txt",
    maxFiles: 3,
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  coppa: {
    type: "checkbox",
    label: "I confirm I am over 13 years old or have parent/teacher permission",
    required: true,
  },
  terms: {
    type: "checkbox",
    label: "I agree to the terms and conditions",
    required: true,
  },
  privacy: {
    type: "checkbox",
    label: "I have read the privacy policy",
    required: true,
  },
  marketing: {
    type: "checkbox",
    label: "I would like to receive updates and marketing emails",
    required: false,
  },
};

/**
 * Default category configurations
 */
export const defaultCategories = {
  general: {
    label: "General Inquiry",
    icon: "MessageCircle",
    fields: ["name", "email", "subject", "message", "attachments"],
  },
  support: {
    label: "Technical Support",
    icon: "HelpCircle",
    fields: [
      "name",
      "email",
      "operatingSystem",
      "browser",
      "message",
      "attachments",
    ],
  },
  feedback: {
    label: "Feedback",
    icon: "ThumbsUp",
    fields: ["name", "email", "message"],
  },
  business: {
    label: "Business Inquiry",
    icon: "Briefcase",
    fields: ["name", "email", "company", "role", "message"],
  },
};

/**
 * Default UI configurations
 */
export const defaultUiConfig = {
  submitButtonText: "Send Message",
  submittingButtonText: "Sending...",
  resetAfterSubmit: true,
  showSuccessMessage: true,
  successMessageDuration: 5000,
  theme: "light",
  labelPosition: "top",
  fieldSpacing: "medium",
  requiredIndicator: "*",
  showRequiredLabel: true,
  requiredLabelText: "Required fields are marked with *",
  errorMessagePosition: "below",
};

/**
 * Default schema for contact form configurations
 */
export const defaultContactSchema = {
  appName: "My App",
  categories: defaultCategories,
  fieldConfigs: defaultFieldConfigs,
  ui: defaultUiConfig,
  validation: {
    validateOnBlur: true,
    validateOnChange: false,
    showErrorsOnBlur: true,
    showErrorsOnSubmit: true,
  },
  routes: {
    basePath: "/contact",
    successPath: "/contact/success",
    apiPath: "/api/contact",
  },
  recaptcha: {
    enabled: false,
    provider: "google-v3",
    siteKey: "",
    minScore: 0.5,
  },
  storage: {
    enabled: false,
    storageKey: "contact_form_data",
    expiry: 24 * 60 * 60 * 1000, // 24 hours
    fields: ["name", "email", "company"],
  },
};

/**
 * Validate a contact form configuration against the schema
 * @param {Object} config - The configuration to validate
 * @returns {Object} Validation result with errors
 */
export function validateContactConfig(config) {
  const errors = [];

  // Check that categories are defined
  if (!config.categories || Object.keys(config.categories).length === 0) {
    errors.push("No categories defined in contact form configuration");
  }

  // Check that each category has required properties
  if (config.categories) {
    Object.entries(config.categories).forEach(([key, category]) => {
      if (!category.label) {
        errors.push(`Category "${key}" is missing a label`);
      }
      if (!Array.isArray(category.fields) || category.fields.length === 0) {
        errors.push(`Category "${key}" has no fields defined`);
      }
    });
  }

  // Check field configurations for fields used in categories
  const usedFields = new Set();
  if (config.categories) {
    Object.values(config.categories).forEach((category) => {
      if (Array.isArray(category.fields)) {
        category.fields.forEach((field) => usedFields.add(field));
      }
    });
  }

  // Check that every used field has a configuration
  usedFields.forEach((field) => {
    if (!config.fieldConfigs || !config.fieldConfigs[field]) {
      errors.push(
        `Field "${field}" is used in categories but has no configuration`,
      );
    }
  });

  // Check recaptcha configuration if enabled
  if (config.recaptcha && config.recaptcha.enabled) {
    if (!config.recaptcha.siteKey) {
      errors.push("reCAPTCHA is enabled but no site key is provided");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Initialize a contact form configuration with defaults and validation
 * @param {Object} userConfig - User-provided configuration
 * @param {Object} options - Additional options for initialization
 * @returns {Object} Complete contact form configuration
 */
/**
 * Get a validator function for a specific category
 * @param {Object} config - The contact form configuration
 * @param {string} categorySlug - The category slug to get validator for
 * @returns {Function|null} A validator function or null if category not found
 */
export function getValidatorForCategory(config, categorySlug) {
  // Handle case where config is the result of initContactFormConfig
  if (typeof config.getValidatorForCategory === "function") {
    return config.getValidatorForCategory(categorySlug);
  }

  const category = config.categories?.[categorySlug];
  if (!category) return null;

  // Return a validator function for this category
  return (data) => {
    const errors = {};

    if (category.fields) {
      category.fields.forEach((fieldName) => {
        const fieldConfig = config.fieldConfigs?.[fieldName];
        if (fieldConfig && fieldConfig.required) {
          const value = data[fieldName];
          if (!value || (typeof value === "string" && value.trim() === "")) {
            errors[fieldName] = `${fieldConfig.label || fieldName} is required`;
          }
        }
      });
    }

    return errors;
  };
}

export function initContactFormConfig(userConfig, options = {}) {
  // Merge with defaults
  const config = secureDeepMerge(defaultContactSchema, userConfig);

  // Validate the configuration
  const validation = validateContactConfig(config);
  if (!validation.valid) {
    // Log warnings but don't throw errors
    logger.warn("Contact form configuration has issues:", validation.errors);
  }

  // Additional configuration functions and objects to return
  return {
    ...config,

    // Get validator for a specific category
    getValidatorForCategory: (categorySlug) => {
      return getValidatorForCategory(config, categorySlug);
    },

    // Parse form data with validation
    formDataParser: async (formData, categorySlug) => {
      // Convert FormData to plain object
      const data = Object.fromEntries(formData);

      // Get validator for this category
      const validator = config.getValidatorForCategory?.(categorySlug);
      let errors = {};

      if (validator) {
        errors = await validator(data);
      }

      return { data, errors };
    },

    // Create a submission handler
    createSubmissionHandler: async (context = {}) => {
      // Return a function that will handle form submissions
      return async (data, categorySlug) => {
        // This function should be customized by the consumer
        // It could send emails, store in database, etc.
        logger.info("Form submission handler called", {
          category: categorySlug,
        });

        // By default, just return success
        return { success: true };
      };
    },

    // Expose validation result
    validationResult: validation,
  };
}
