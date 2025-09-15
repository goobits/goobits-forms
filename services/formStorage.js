/**
 * Form Storage - Local storage utilities for form data persistence
 *
 * This module provides utilities for saving and retrieving form data from localStorage
 * to prevent data loss when users navigate away from the page.
 */

// Import logger utility and constants
import { createLogger } from "../utils/logger.js";
import {
  IS_BROWSER,
  STORAGE_KEY,
  STORAGE_EXPIRY_KEY,
  DEFAULT_EXPIRY_HOURS,
} from "../utils/constants.js";
// import { handleError } from '../utils/errorHandler.js'

const logger = createLogger("FormStorage");

/**
 * Save form data to localStorage
 * @param {Object} formData - Form data to save
 * @param {string} category - Current form category
 * @returns {boolean} - Success status
 */
export function saveFormData(formData, category) {
  if (!IS_BROWSER) return false;

  try {
    // Only save if there's actual user data (at least one field with content)
    const hasUserData = Object.keys(formData).some((key) => {
      // Skip system fields and empty values
      if (key === "category" || key === "attachments") return false;
      return !!formData[key];
    });

    if (!hasUserData) {
      logger.debug("No user data to save");
      return false;
    }

    // Store form data by category
    const existingData = loadAllFormData() || {};

    // Filter out fields that shouldn't be stored (like attachments)
    const filteredData = {};
    for (const key in formData) {
      // Skip attachments and empty fields
      if (key === "attachments" || !formData[key]) continue;

      // Store other fields
      filteredData[key] = formData[key];
    }

    // Update data for this category
    existingData[category] = filteredData;

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));

    // Set expiry timestamp
    const expiryTime = Date.now() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_EXPIRY_KEY, expiryTime.toString());

    logger.debug(`Saved form data for category: ${category}`);
    return true;
  } catch (error) {
    logger.error("Error saving form data to localStorage", error);
    return false;
  }
}

/**
 * Load form data for a specific category from localStorage
 * @param {string} category - Form category to load
 * @returns {Object|null} - Loaded form data or null if not found
 */
export function loadFormData(category) {
  if (!IS_BROWSER) return null;

  try {
    // Check if data is expired
    if (isDataExpired()) {
      clearAllFormData();
      return null;
    }

    // Load all saved data
    const allData = loadAllFormData();
    if (!allData || !allData[category]) {
      return null;
    }

    logger.debug(`Loaded saved form data for category: ${category}`);
    return allData[category];
  } catch (error) {
    logger.error("Error loading form data from localStorage", error);
    return null;
  }
}

/**
 * Load all saved form data (internal use only)
 * @returns {Object|null} - All saved form data or null if not found
 */
function loadAllFormData() {
  if (!IS_BROWSER) return null;

  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    logger.error("Error parsing saved form data", error);
    return null;
  }
}

/**
 * Clear form data for a specific category
 * @param {string} category - Form category to clear
 * @returns {boolean} - Success status
 */
export function clearFormData(category) {
  if (!IS_BROWSER) return false;

  try {
    const allData = loadAllFormData();
    if (allData && allData[category]) {
      delete allData[category];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      logger.debug(`Cleared form data for category: ${category}`);
    }
    return true;
  } catch (error) {
    logger.error("Error clearing form data", error);
    return false;
  }
}

/**
 * Clear all saved form data
 * @returns {boolean} - Success status
 */
export function clearAllFormData() {
  if (!IS_BROWSER) return false;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
    logger.debug("Cleared all saved form data");
    return true;
  } catch (error) {
    logger.error("Error clearing all form data", error);
    return false;
  }
}

/**
 * Check if saved data is expired
 * @returns {boolean} - True if data is expired or expiry time is not set
 */
function isDataExpired() {
  try {
    const expiryTime = localStorage.getItem(STORAGE_EXPIRY_KEY);
    if (!expiryTime) return true;

    const expiryTimestamp = parseInt(expiryTime, 10);
    return Date.now() > expiryTimestamp;
  } catch (error) {
    return true;
  }
}
