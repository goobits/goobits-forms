/**
 * Configuration management for @goobits/forms
 */

import { z } from "zod";
import { defaultConfig } from "./defaults";
import { createLogger } from "../utils/logger";
import type { ContactFormConfig, FormData, ValidationResult, SubmissionResult } from "./types";

export { defaultMessages } from "./defaultMessages";
export {
  initContactFormConfig as initFormConfig,
  getValidatorForCategory,
} from "./contactSchemas";

const logger = createLogger("Config");

// Configuration state
let currentConfig: ContactFormConfig | null = null;

/**
 * Deep merge utility to combine configuration objects
 */
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key: string) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key] as Record<string, any>, source[key] as Record<string, any>);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

/**
 * Check if a value is an object
 */
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Initialize the contact form configuration
 */
export function initContactFormConfig(userConfig: Partial<ContactFormConfig> = {}): ContactFormConfig {
  // Merge user config with defaults
  currentConfig = deepMerge(defaultConfig, userConfig) as ContactFormConfig;

  // Build validation schemas based on configuration
  currentConfig.schemas = buildValidationSchemas(currentConfig);

  // Build field mappings
  currentConfig.categoryToFieldMap = buildCategoryFieldMap(currentConfig);

  // Add form data parser
  currentConfig.formDataParser = createFormDataParser(currentConfig);

  // Add submission handler factory
  currentConfig.createSubmissionHandler = createSubmissionHandlerFactory(currentConfig);

  return currentConfig;
}

/**
 * Create form data parser with validation
 */
function createFormDataParser(config: ContactFormConfig) {
  return async (formData: FormData, category: string = "general"): Promise<ValidationResult> => {
    try {
      const schema =
        config.schemas?.categories?.[category] ||
        config.schemas?.categories?.general;

      if (!schema) {
        throw new Error(`No validation schema found for category: ${category}`);
      }

      const result = schema.safeParse(formData);

      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          errors[path] = issue.message;
        });
        return { isValid: false, errors };
      }

      return { isValid: true, data: result.data };
    } catch (error: any) {
      return {
        isValid: false,
        errors: { general: error.message || "Validation failed" },
      };
    }
  };
}

/**
 * Create submission handler factory
 */
function createSubmissionHandlerFactory(config: ContactFormConfig) {
  return (options: { recipient?: string; subject?: string } = {}) => {
    // Default email subject and recipient based on config
    const defaultRecipient =
      config.defaultRecipient || "contact@example.com";
    const defaultSubject =
      config.defaultSubject || "New Contact Form Submission";

    return async (
      data: FormData,
      category: string,
      locals?: any
    ): Promise<SubmissionResult> => {
      try {
        const recipient = options.recipient || defaultRecipient;
        const subject = options.subject || defaultSubject;

        // Get category specific configuration
        const categoryConfig = config.categories[category] || {};

        // Log the submission
        logger.info?.("Form submission received", {
          category,
          timestamp: new Date().toISOString(),
          data,
        });

        // Use email service if available in locals
        if (locals && locals.emailService) {
          await locals.emailService.sendEmail({
            to: recipient,
            subject: `${subject} - ${category}`,
            html: formatSubmissionEmail(data, category, categoryConfig),
            text: formatSubmissionEmailText(data, category, categoryConfig),
          });
        } else {
          // Log submission if no email service is available
          logger.info?.("Email service not available, logging submission", {
            recipient,
            subject,
            category,
            data,
          });
        }

        const successMessage = config.successMessages?.general;
        const message = typeof successMessage === "string"
          ? successMessage
          : typeof successMessage === "function"
            ? successMessage()
            : "Form submitted successfully";

        return {
          success: true,
          message,
        };
      } catch (error: any) {
        logger.error?.("Form submission failed", { error: error.message, category, data });
        throw new Error("Failed to process form submission");
      }
    };
  };
}

/**
 * Get the current configuration
 */
export function getContactFormConfig(): ContactFormConfig {
  if (!currentConfig) {
    logger.warn?.(
      "Config not initialized, using defaults. Call initContactFormConfig() at app startup.",
    );
    currentConfig = { ...defaultConfig } as ContactFormConfig;
    currentConfig.schemas = buildValidationSchemas(currentConfig);
    currentConfig.categoryToFieldMap = buildCategoryFieldMap(currentConfig);
  }

  return currentConfig;
}

/**
 * Build validation schemas from configuration
 */
function buildValidationSchemas(config: ContactFormConfig) {
  const { fieldConfigs, errorMessages, fileSettings } = config;

  // Helper function to get message safely
  const getMessage = (messageOrFn: string | ((...args: any[]) => string) | undefined, fallback: string, ...args: any[]): string => {
    if (typeof messageOrFn === "string") return messageOrFn;
    if (typeof messageOrFn === "function") return messageOrFn(...args);
    return fallback;
  };

  // Build individual field schemas
  const builder: Record<string, (fieldName: string) => z.ZodTypeAny> = {
    email: () => z.string().email(getMessage(errorMessages.email, "Invalid email")),
    tel: () => z.string(),
    checkbox: (fieldName: string) =>
      z
        .union([z.literal("on"), z.literal(true)])
        .refine((val) => val === "on" || val === true, {
          message: getMessage(errorMessages.required, `${fieldName} is required`, fieldName),
        }),
    select: () => z.string().min(1, "Please select an option"),
    textarea: () => z.string(),
    text: () => z.string(),
    url: () => z.string().url(getMessage(errorMessages.url, "Invalid URL")),
    number: () => z.string().refine((val) => !isNaN(Number(val)), "Must be a number"),
    date: () => z.string(),
    time: () => z.string(),
  };

  const schemas: Record<string, z.ZodTypeAny> = {};

  Object.entries(fieldConfigs).forEach(([fieldName, fieldConfig]) => {
    const type = fieldConfig.type || "text";
    const builderFn = builder[type] || builder.text;
    let schema = builderFn(fieldName);

    // Add required validation if needed
    if (fieldConfig.required) {
      schema = schema.refine((val) => val && val.toString().trim().length > 0, {
        message: getMessage(errorMessages.required, `${fieldName} is required`, fieldName),
      });
    }

    schemas[fieldName] = schema;
  });

  // Add file attachment schema
  schemas.attachments = z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
      })
    )
    .optional();

  // Build category schemas
  const categories = Object.entries(config.categories).reduce(
    (acc, [categoryName, categoryConfig]) => {
      const categoryFields = categoryConfig.fields.reduce(
        (fields: Record<string, z.ZodTypeAny>, fieldName: string) => {
          if (schemas[fieldName]) {
            fields[fieldName] = schemas[fieldName];
          }
          return fields;
        },
        {}
      );

      // Add attachments to all categories
      if (schemas.attachments) {
        categoryFields.attachments = schemas.attachments;
      }

      acc[categoryName] = z.object(categoryFields);
      return acc;
    },
    {} as Record<string, z.ZodObject<any>>
  );

  return { schemas, categories };
}

/**
 * Build category to field mapping
 */
function buildCategoryFieldMap(config: ContactFormConfig): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  for (const [categoryName, categoryConfig] of Object.entries(
    config.categories
  )) {
    map[categoryName] = categoryConfig.fields;
  }

  return map;
}

/**
 * Format submission email (HTML)
 */
function formatSubmissionEmail(
  data: FormData,
  category: string,
  categoryConfig: any
): string {
  // Implementation would format the data into HTML email
  return `<h2>Form Submission - ${category}</h2><pre>${JSON.stringify(data, null, 2)}</pre>`;
}

/**
 * Format submission email (plain text)
 */
function formatSubmissionEmailText(
  data: FormData,
  category: string,
  categoryConfig: any
): string {
  // Implementation would format the data into plain text email
  return `Form Submission - ${category}\n\n${JSON.stringify(data, null, 2)}`;
}