import { getContactFormConfig } from "../config/index.js";
import { loadFormData } from "./formStorage.js";
import { createLogger } from "../utils/logger.js";
import { IS_BROWSER, IS_DEV } from "../utils/constants.js";

const logger = createLogger("FormHydration");

// Default test data function (can be overridden)
const getTestData = () => ({});

/**
 * Updates the form state and URL based on the selected category
 * @param {Object} params Configuration object
 * @param {string} params.selectedCategory The currently selected form category
 * @param {Object} params.formData The current form data object
 * @param {boolean} params.preferCache Whether to prefer cached data over existing form data
 * @returns {Object} Updated form data
 */
export function hydrateForm({
  selectedCategory,
  formData,
  preferCache = true,
}) {
  // Get configuration
  const config = getContactFormConfig();
  const { fieldConfigs } = config;

  // Get browser and OS info
  const detectedInfo = detectBrowserInfo();

  // Auto-detectable field values map
  const autoDetectValues = {
    browser: detectedInfo.browser,
    browserVersion: detectedInfo.version,
    operatingSystem: detectedInfo.os,
  };

  // In development, use test data
  if (IS_DEV) {
    const testFormData = getTestData(selectedCategory);

    // Merge test data with auto-detected values
    return {
      ...testFormData,
      ...Object.fromEntries(
        Object.keys(fieldConfigs)
          .filter((key) => fieldConfigs[key].autoDetect)
          .map((key) => [key, autoDetectValues[key] || testFormData[key]]),
      ),
    };
  }

  // Try to load cached form data if available
  let cachedData = {};
  if (preferCache && IS_BROWSER) {
    try {
      const savedData = loadFormData(selectedCategory);
      if (savedData) {
        logger.debug(`Restored saved data for category: ${selectedCategory}`);
        cachedData = savedData;
      }
    } catch (error) {
      logger.error("Failed to load cached form data:", error);
    }
  }

  // For production: combine auto-detected values with existing form data and cached data
  return {
    // Auto-detected browser info for fields that support it
    ...Object.fromEntries(
      Object.keys(fieldConfigs)
        .filter((key) => fieldConfigs[key].autoDetect)
        .map((key) => [key, autoDetectValues[key]]),
    ),

    // Cached form data (if available and preferred)
    ...(preferCache ? cachedData : {}),

    // Existing form data takes precedence if we're not preferring cache
    ...(preferCache ? {} : formData),

    // Always set the selected category
    category: selectedCategory,
  };
}

/**
 * Detect browser and OS info
 * @returns {Object} The detected browser and OS info.
 */
function detectBrowserInfo() {
  if (!IS_BROWSER) {
    return {};
  }

  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  let browser = "";
  let version = "";
  let os = "";

  // Detect OS
  if (/Windows/.test(platform)) os = "Windows";
  else if (/Mac/.test(platform)) os = "macOS";
  else if (/Linux/.test(platform)) os = "Linux";
  else if (/iPhone/.test(userAgent)) os = "iOS";
  else if (/Android/.test(userAgent)) os = "Android";

  // Detect browser and version
  if (/Firefox\/([0-9.]+)/.test(userAgent)) {
    browser = "Firefox";
    version = userAgent.match(/Firefox\/([0-9.]+)/)[1];
  } else if (/Chrome\/([0-9.]+)/.test(userAgent)) {
    browser = "Chrome";
    version = userAgent.match(/Chrome\/([0-9.]+)/)[1];
  } else if (/Safari\/([0-9.]+)/.test(userAgent)) {
    browser = "Safari";
    version = userAgent.match(/Version\/([0-9.]+)/)?.[1] || "";
  } else if (/Edge\/([0-9.]+)/.test(userAgent)) {
    browser = "Edge";
    version = userAgent.match(/Edge\/([0-9.]+)/)[1];
  }

  return { browser, version, os };
}
