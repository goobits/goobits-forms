/**
 * CSRF (Cross-Site Request Forgery) protection utilities
 *
 * Provides token generation and validation to protect forms against CSRF attacks.
 * Uses an in-memory token store with automatic cleanup.
 */

// Check if we're in a browser or server environment
const isBrowser = typeof window !== "undefined";

// Simple in-memory token store (in production, use Redis or database)
const tokenStore = isBrowser ? new Map() : new Map();
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a secure random token
 * @returns {Promise<string>} A secure random token
 */
async function generateSecureToken() {
  if (isBrowser) {
    // Browser implementation using Web Crypto API
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  } else {
    // Server implementation using Node.js crypto module
    const crypto = await import("crypto");
    return crypto.randomBytes(32).toString("base64url");
  }
}

/**
 * Generate a CSRF token
 * @returns {Promise<string>} CSRF token
 */
export async function generateCsrfToken() {
  const token = await generateSecureToken();
  const expires = Date.now() + TOKEN_EXPIRY_MS;

  tokenStore.set(token, expires);

  // Clean up expired tokens periodically using crypto-secure random
  const randomBytes = new Uint8Array(1);
  crypto.getRandomValues(randomBytes);
  if (randomBytes[0] < 25) {
    // ~10% chance (25/256)
    cleanupExpiredTokens();
  }

  return token;
}

/**
 * Validate a CSRF token
 * @param {string} token - Token to validate
 * @returns {boolean} Whether token is valid
 */
export function validateCsrfToken(token) {
  if (!token || typeof token !== "string") {
    return false;
  }

  const expires = tokenStore.get(token);
  if (!expires) {
    return false;
  }

  if (Date.now() > expires) {
    tokenStore.delete(token);
    return false;
  }

  // Token is valid - remove it to prevent reuse
  tokenStore.delete(token);
  return true;
}

/**
 * Clean up expired tokens from memory
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, expires] of tokenStore.entries()) {
    if (now > expires) {
      tokenStore.delete(token);
    }
  }
}

/**
 * Create middleware for CSRF protection in SvelteKit
 * @param {Object} options - Options for CSRF middleware
 * @returns {Function} CSRF middleware function
 */
export function createCsrfProtection(options = {}) {
  const {
    tokenName = "csrf",
    headerName = "x-csrf-token",
    excludePaths = ["/api/health"],
    excludeMethods = ["GET", "HEAD", "OPTIONS"],
    errorStatus = 403,
    errorMessage = "Invalid CSRF token",
  } = options;

  return async ({ event, resolve }) => {
    const path = event.url.pathname;
    const method = event.request.method;

    // Skip CSRF check for excluded paths and methods
    if (
      excludePaths.some((p) => path.startsWith(p)) ||
      excludeMethods.includes(method)
    ) {
      return resolve(event);
    }

    // Check for token in headers, body, or cookies
    const headerToken = event.request.headers.get(headerName);

    // For non-GET requests, validate CSRF token
    let isValid = false;

    // Try header token first
    if (headerToken) {
      isValid = validateCsrfToken(headerToken);
    }

    // If not valid and it's a form submission, try form data
    if (
      !isValid &&
      event.request.headers.get("content-type")?.includes("form")
    ) {
      try {
        const formData = await event.request.formData();
        const formToken = formData.get(tokenName);
        if (formToken) {
          isValid = validateCsrfToken(formToken);
          // Re-create the request since we consumed the body
          event.request = new Request(event.request.url, {
            method: event.request.method,
            headers: event.request.headers,
            body: formData,
          });
        }
      } catch (error) {
        // Form parsing failed, continue with other methods
      }
    }

    // If still not valid, check for token in cookies
    if (!isValid) {
      const cookieToken = event.cookies.get(tokenName);
      if (cookieToken) {
        isValid = validateCsrfToken(cookieToken);
      }
    }

    // If no valid token found, return error
    if (!isValid) {
      return new Response(errorMessage, {
        status: errorStatus,
      });
    }

    return resolve(event);
  };
}

/**
 * Create CSRF token manager with multiple storage methods
 * @param {Object} options - Options for token manager
 * @returns {Object} CSRF token manager functions
 */
export function createCsrfManager(options = {}) {
  const {
    cookieName = "csrf",
    formFieldName = "csrf",
    headerName = "X-CSRF-Token",
    secure = true,
    path = "/",
    sameSite = "lax",
  } = options;

  return {
    /**
     * Generate token and store in cookie
     * @param {Object} cookies - SvelteKit cookies object
     * @returns {string} Generated token
     */
    generateToken(cookies) {
      const token = generateCsrfToken();
      cookies.set(cookieName, token, {
        path,
        secure,
        sameSite,
        httpOnly: true,
        maxAge: 60 * 60, // 1 hour
      });
      return token;
    },

    /**
     * Validate token from request
     * @param {Request} request - Request object
     * @param {Object} cookies - SvelteKit cookies object
     * @returns {boolean} Whether token is valid
     */
    async validateRequest(request, cookies) {
      // Try header first
      const headerToken = request.headers.get(headerName);
      if (headerToken && validateCsrfToken(headerToken)) {
        return true;
      }

      // Try cookie
      const cookieToken = cookies.get(cookieName);
      if (cookieToken && validateCsrfToken(cookieToken)) {
        return true;
      }

      // Try form data if appropriate content type
      if (request.headers.get("content-type")?.includes("form")) {
        try {
          const formData = await request.formData();
          const formToken = formData.get(formFieldName);
          if (formToken && validateCsrfToken(formToken)) {
            return true;
          }
        } catch (error) {
          // Form parsing failed
        }
      }

      return false;
    },
  };
}
