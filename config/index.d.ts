/**
 * Configuration management for @goobits/forms
 */
import type { ContactFormConfig } from "./types";
export { defaultMessages } from "./defaultMessages";
export { initContactFormConfig as initFormConfig, getValidatorForCategory, } from "./contactSchemas";
/**
 * Initialize the contact form configuration
 */
export declare function initContactFormConfig(userConfig?: Partial<ContactFormConfig>): ContactFormConfig;
/**
 * Get the current configuration
 */
export declare function getContactFormConfig(): ContactFormConfig;
