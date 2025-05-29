/**
 * Dynamic imports for AWS dependencies
 * This allows us to avoid directly importing AWS in the main package
 * and only load it when needed
 */

export async function getAwsDependencies() {
  try {
    // Import the AWS SDK v3 and nodemailer
    const { SES } = await import('@aws-sdk/client-ses');
    const nodemailerModule = await import('nodemailer');
    
    return { 
      aws: { SES },
      nodemailer: nodemailerModule.default || nodemailerModule
    };
  } catch (error) {
    console.error('Failed to import AWS dependencies:', error)
    throw new Error(
      'Missing AWS dependencies. Please install @aws-sdk/client-ses and nodemailer to use AWS SES email provider.'
    )
  }
}

// Default exports for easier dynamic importing
export const aws = { SES: null }
export const nodemailer = { createTransport: null }

// Initialize async
getAwsDependencies().then(deps => {
  Object.assign(aws, deps.aws)
  Object.assign(nodemailer, deps.nodemailer)
}).catch(err => {
  console.warn('AWS dependencies not available:', err.message)
})