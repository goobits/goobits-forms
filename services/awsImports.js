/**
 * @fileoverview Dynamic imports for AWS dependencies
 * This allows us to avoid directly importing AWS in the main package
 * and only load it when needed
 */
/**
 * Dynamically imports AWS dependencies to avoid bundling when not needed
 *
 * @returns {Promise<AwsDependencies>} AWS SES and nodemailer dependencies
 * @throws {Error} When AWS dependencies are missing or failed to import
 *
 * @example
 * ```typescript
 * try {
 *   const { aws, nodemailer } = await getAwsDependencies();
 *   const ses = new aws.SES({ region: 'us-east-1' });
 *   const transporter = nodemailer.createTransport({ SES: { ses, aws } });
 * } catch (error) {
 *   console.error('AWS dependencies not available:', error.message);
 * }
 * ```
 */
export async function getAwsDependencies() {
    try {
        // Import the AWS SDK v3 and nodemailer
        const { SES } = await import("@aws-sdk/client-ses");
        const nodemailerModule = await import("nodemailer");
        return {
            aws: { SES },
            nodemailer: nodemailerModule.default || nodemailerModule,
        };
    }
    catch (error) {
        console.error("Failed to import AWS dependencies:", error);
        throw new Error("Missing AWS dependencies. Please install @aws-sdk/client-ses and nodemailer to use AWS SES email provider.");
    }
}
/**
 * Default exports for easier dynamic importing
 * These are initialized asynchronously and may be null initially
 */
export const aws = { SES: null };
export const nodemailer = { createTransport: null };
/**
 * Initialize AWS dependencies asynchronously
 * This runs immediately when the module is imported but doesn't block
 */
getAwsDependencies()
    .then((deps) => {
    Object.assign(aws, deps.aws);
    Object.assign(nodemailer, deps.nodemailer);
})
    .catch((err) => {
    console.warn("AWS dependencies not available:", err.message);
});
