/**
 * Default configuration for @goobits/contactform
 */

// import { z } from 'zod'

// Default error messages
export const defaultErrorMessages = {
  // Common validation errors
  required: (field) => `Please provide your ${field}`,
  invalid: (field) => `Please provide a valid ${field}`,
  select: (field) => `Please select ${field}`,

  // File-related errors
  fileSize: "File size must be less than 5MB",
  fileType: "Only .jpg, .jpeg, .png, .webp and .gif files are accepted",
  maxFiles: "Maximum 3 images allowed",

  // Specific field error messages
  name: "Please provide your name",
  email: "Please enter a valid email address",
  message: "Please share your message with us",
  coppa: "Please confirm you're over 13 or have parent/teacher permission",
  phone: "Please provide a contact phone number",
  preferredDate: "Please select your preferred date",
  preferredTime: "Please select your preferred time",

  // Form-specific field errors
  browser: "Please tell us which browser you're using",
  browserVersion: "Please tell us your browser version",
  operatingSystem: "Please tell us which operating system you're using",
  company: "Please provide your company name",
  businessRole: "Please tell us your role in the company",
  institution: "Please provide your institution name",
  educationRole: "Please tell us your role in education",
  featureArea: "Please tell us which feature area you're referring to",

  // reCAPTCHA specific errors
  recaptchaInit:
    "We're having trouble with our security check. Please refresh the page and try again.",
  recaptchaVerification:
    "Security verification failed. Please try submitting again.",
  recaptchaMissing:
    "Security verification incomplete. Please ensure JavaScript is enabled and try again.",
};

// Default file settings
export const defaultFileSettings = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  acceptedImageTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
};

// Default form categories
export const defaultCategories = {
  general: {
    label: "General Inquiry",
    icon: "fa fa-envelope",
    fields: ["name", "email", "message", "attachments", "coppa"],
  },
  support: {
    label: "Support Request",
    icon: "fa fa-question-circle",
    fields: [
      "name",
      "email",
      "message",
      "browser",
      "browserVersion",
      "operatingSystem",
      "attachments",
      "coppa",
    ],
  },
  feedback: {
    label: "Feedback",
    icon: "fa fa-comment",
    fields: ["name", "email", "message", "attachments", "coppa"],
  },
  booking: {
    label: "Book an Appointment",
    icon: "fa fa-calendar",
    fields: [
      "name",
      "email",
      "phone",
      "preferredDate",
      "preferredTime",
      "message",
      "coppa",
    ],
  },
  business: {
    label: "Business Inquiry",
    icon: "fa fa-briefcase",
    fields: ["name", "email", "company", "businessRole", "message", "coppa"],
  },
};

// Default field configurations
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
    maxlength: 254,
  },
  message: {
    type: "textarea",
    label: "Message",
    placeholder: "Tell us more...",
    required: true,
    rows: 5,
    maxlength: 5000,
  },
  phone: {
    type: "tel",
    label: "Phone",
    placeholder: "+1 (555) 123-4567",
    required: true,
  },
  company: {
    type: "text",
    label: "Company",
    placeholder: "Your company name",
    required: true,
  },
  businessRole: {
    type: "text",
    label: "Role",
    placeholder: "Your role",
    required: true,
  },
  preferredDate: {
    type: "date",
    label: "Preferred Date",
    required: true,
  },
  preferredTime: {
    type: "time",
    label: "Preferred Time",
    required: true,
  },
  browser: {
    type: "text",
    label: "Browser",
    placeholder: "Chrome, Firefox, Safari, etc.",
    required: true,
  },
  browserVersion: {
    type: "text",
    label: "Browser Version",
    placeholder: "e.g., 91.0",
    required: true,
  },
  operatingSystem: {
    type: "text",
    label: "Operating System",
    placeholder: "Windows 10, macOS, etc.",
    required: true,
  },
  coppa: {
    type: "checkbox",
    label: "I confirm I am over 13 years old or have parent/teacher permission",
    required: true,
  },
  attachments: {
    type: "file",
    label: "Add Images (Optional)",
    accept: "image/jpeg,image/jpg,image/png,image/webp,image/gif",
    maxFiles: 3,
    maxSize: 5 * 1024 * 1024, // 5MB
    required: false,
  },
};

// Default reCAPTCHA configuration
export const defaultRecaptchaConfig = {
  enabled: false,
  provider: "google-v3",
  siteKey: "",
  secretKey: "",
  minScore: 0.5,
  cacheTimeout: 110000,
};

// Default API configuration
export const defaultApiConfig = {
  endpoint: "/api/contact",
  timeout: 30000,
  retries: 1,
};

// Default UI configuration
export const defaultUiConfig = {
  showSuccessMessage: true,
  successMessageDuration: 5000,
  showFieldErrors: true,
  focusFirstError: true,
  scrollToError: true,
  submitButtonText: "Send Message",
  submittingButtonText: "Sending...",
  resetAfterSubmit: true,
};

// Default i18n configuration
export const defaultI18nConfig = {
  enabled: false,
  supportedLanguages: ["en"],
  defaultLanguage: "en",
  includeLanguageInURL: false,
  autoDetectLanguage: false,
  languageDetectionOrder: ["url", "sessionStorage", "browser"],
  persistLanguageKey: "contactform-lang",
};

// Complete default configuration
export const defaultConfig = {
  appName: "ContactForm",
  formUri: "/contact",
  errorMessages: defaultErrorMessages,
  fileSettings: defaultFileSettings,
  categories: defaultCategories,
  fieldConfigs: defaultFieldConfigs,
  recaptcha: defaultRecaptchaConfig,
  api: defaultApiConfig,
  ui: defaultUiConfig,
  i18n: defaultI18nConfig,
};
