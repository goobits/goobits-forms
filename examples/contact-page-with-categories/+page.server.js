import { createContactRouteHandlers } from "../../handlers/categoryRouter.js";
import { validateCsrfToken } from "../../security/csrf.js";

// Import your configuration here
// This is an example file, so you'd typically customize this for your specific app
// import { contactConfig } from '$lib/config/contact.js'
// import { initContactFormConfig } from '@goobits/forms/config/contactSchemas.js'

// Example contact configuration for demonstration purposes
const exampleContactConfig = {
  appName: "Example App",
  categories: {
    general: {
      label: "General Inquiry",
      icon: "MessageCircle",
      fields: ["name", "email", "subject", "message"],
    },
    support: {
      label: "Technical Support",
      icon: "HelpCircle",
      fields: ["name", "email", "operatingSystem", "browser", "message"],
    },
    feedback: {
      label: "Feedback",
      icon: "ThumbsUp",
      fields: ["name", "email", "message"],
    },
  },
  fieldConfigs: {
    name: {
      type: "text",
      label: "Name",
      placeholder: "Your name",
      required: true,
    },
    email: {
      type: "email",
      label: "Email",
      placeholder: "your@email.com",
      required: true,
    },
    subject: {
      type: "text",
      label: "Subject",
      placeholder: "What is this regarding?",
      required: true,
    },
    message: {
      type: "textarea",
      label: "Message",
      placeholder: "Your message",
      required: true,
      rows: 5,
    },
    operatingSystem: {
      type: "text",
      label: "Operating System",
      placeholder: "e.g., Windows, macOS, Linux, iOS, Android",
      required: true,
    },
    browser: {
      type: "text",
      label: "Browser",
      placeholder: "e.g., Chrome, Firefox, Safari, Edge",
      required: true,
    },
  },
  ui: {
    submitButtonText: "Send Message",
    submittingButtonText: "Sending...",
    showSuccessMessage: true,
  },
  routes: {
    basePath: "/contact",
    successPath: "/contact/success",
  },
};

// In a real implementation, you'd use your app's actual configuration:
// const formConfig = initContactFormConfig(contactConfig)

// For this example, we'll create a sample config
const formConfig = {
  ...exampleContactConfig,
  getValidatorForCategory: (categorySlug) => {
    // Simple validator that checks required fields
    return (data) => {
      const errors = {};
      const category = exampleContactConfig.categories[categorySlug];

      if (category && category.fields) {
        category.fields.forEach((fieldName) => {
          const fieldConfig = exampleContactConfig.fieldConfigs[fieldName];
          if (fieldConfig && fieldConfig.required) {
            const value = data[fieldName];
            if (!value || (typeof value === "string" && value.trim() === "")) {
              errors[fieldName] =
                `${fieldConfig.label || fieldName} is required`;
            }
          }
        });
      }

      return errors;
    };
  },
  formDataParser: async (formData, categorySlug) => {
    // Convert FormData to plain object
    const data = Object.fromEntries(formData);

    // Get validator for this category
    const validator = formConfig.getValidatorForCategory(categorySlug);
    let errors = {};

    if (validator) {
      errors = await validator(data);
    }

    return { data, errors };
  },
  createSubmissionHandler: async () => {
    // Return a function that will handle form submissions
    return async (data, categorySlug) => {
      console.log("Form submission received:", {
        data,
        category: categorySlug,
      });

      // In a real implementation, you'd do something with the data
      // like sending an email or storing in a database

      // For this example, we'll just return success
      return { success: true };
    };
  },
};

// Create route handlers
// In a real implementation, you'd use createContactRouteHandlers(formConfig)
export const { load, actions } = createContactRouteHandlers({
  categories: formConfig.categories,
  basePath: formConfig.routes.basePath,
  successPath: formConfig.routes.successPath,
  getValidatorForCategory: formConfig.getValidatorForCategory,
  formDataParser: formConfig.formDataParser,
  createSubmissionHandler: formConfig.createSubmissionHandler,
});
