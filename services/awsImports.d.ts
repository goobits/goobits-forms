/**
 * @fileoverview Dynamic imports for AWS dependencies
 * This allows us to avoid directly importing AWS in the main package
 * and only load it when needed
 */
import type { SES } from '@aws-sdk/client-ses';
import type * as NodemailerType from 'nodemailer';
/**
 * AWS dependencies interface
 */
export interface AwsDependencies {
    /** AWS SDK v3 SES client */
    aws: {
        SES: typeof SES;
    };
    /** Nodemailer module for email transport */
    nodemailer: typeof NodemailerType;
}
/**
 * AWS service object with optional SES client
 */
export interface AwsService {
    SES: typeof SES | null;
}
/**
 * Nodemailer service object with optional createTransport function
 */
export interface NodemailerService {
    createTransport: typeof NodemailerType.createTransport | null;
}
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
export declare function getAwsDependencies(): Promise<AwsDependencies>;
/**
 * Default exports for easier dynamic importing
 * These are initialized asynchronously and may be null initially
 */
export declare const aws: AwsService;
export declare const nodemailer: NodemailerService;
