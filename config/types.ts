/**
 * Type definitions for @goobits/forms configuration
 */

import { z } from "zod";

// Basic interfaces
export interface MessageObject {
  [key: string]: string | ((...args: any[]) => string);
}

export interface FieldConfig {
  type?: string;
  required?: boolean;
  placeholder?: string;
  label?: string;
  validation?: any;
  maxlength?: number;
  rows?: number;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
}

export interface CategoryConfig {
  fields: string[];
  label?: string;
  icon?: string;
  [key: string]: any;
}

export interface FileSettings {
  maxSize?: number;
  acceptedImageTypes?: string[];
  allowedTypes?: string[];
  maxFiles?: number;
  maxFileSize?: number;
}

export interface ContactFormConfig {
  appName: string;
  formUri: string;
  errorMessages: MessageObject;
  successMessages?: MessageObject;
  fieldConfigs: Record<string, FieldConfig>;
  categories: Record<string, CategoryConfig>;
  fileSettings: FileSettings;
  defaultRecipient?: string;
  defaultSubject?: string;
  emailService?: any;
  i18n?: any;
  // Additional extended properties
  recaptcha?: any;
  api?: any;
  ui?: any;
  // Dynamic properties added during initialization
  schemas?: any;
  categoryToFieldMap?: Record<string, string[]>;
  formDataParser?: any;
  createSubmissionHandler?: any;
}

export interface FormData {
  [key: string]: any;
  attachments?: File[];
}

export interface ValidationResult {
  isValid: boolean;
  errors?: Record<string, string>;
  data?: FormData;
}

export interface SubmissionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
}