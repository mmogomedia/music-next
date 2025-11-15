import { Resend } from 'resend';

// Lazy initialization - only create Resend instance when API key is available
let resend: Resend | null = null;

function getResendInstance(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  data?: any;
}

/**
 * Send an email using Resend
 * @param options - Email options
 * @returns Promise with send result
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const resendInstance = getResendInstance();

  if (!resendInstance) {
    console.error('RESEND_API_KEY is not configured');
    return {
      success: false,
      error: 'Email service is not configured',
    };
  }

  try {
    const fromEmail =
      options.from ||
      process.env.RESEND_FROM_EMAIL ||
      'Flemoji <no-reply@flemoji.com>';

    const emailData: any = {
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };
    if (options.html) emailData.html = options.html;
    if (options.text) emailData.text = options.text;
    if (options.replyTo) emailData.replyTo = options.replyTo;
    if (options.tags) emailData.tags = options.tags;

    const { data, error } = await resendInstance.emails.send(emailData);

    if (error) {
      console.error('Resend email error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      id: data?.id,
      data,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export interface VerificationEmailData {
  email: string;
  name?: string;
  token: string;
}

/**
 * Send a verification email with enhanced template
 */
export async function sendVerificationEmail({
  email,
  name,
  token,
}: VerificationEmailData): Promise<SendEmailResult> {
  const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Flemoji</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Flemoji!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi${name ? ` ${name}` : ''},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for signing up for Flemoji! Please verify your email address to complete your registration.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
            ${verificationUrl}
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            This link will expire in 24 hours.
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If you didn't create an account with Flemoji, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} Flemoji. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${name || 'there'},\n\nThank you for signing up for Flemoji! Please verify your email address to complete your registration.\n\nClick this link to verify: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account with Flemoji, you can safely ignore this email.`;

  return sendEmail({
    to: email,
    from: 'Flemoji <no-reply@flemoji.com>',
    subject: 'Verify your email address - Flemoji',
    html,
    text,
    tags: [{ name: 'type', value: 'verification' }],
  });
}

export interface PasswordResetEmailData {
  email: string;
  name?: string;
  token: string;
}

/**
 * Send a password reset email with enhanced template
 */
export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: PasswordResetEmailData): Promise<SendEmailResult> {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Flemoji</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi${name ? ` ${name}` : ''},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            We received a request to reset your password for your Flemoji account. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
            ${resetUrl}
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            This link will expire in 1 hour.
          </p>
          <p style="font-size: 14px; color: #dc2626; margin-top: 20px; font-weight: 600;">
            If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} Flemoji. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${name || 'there'},\n\nWe received a request to reset your password for your Flemoji account. Click the following link to create a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email. Your password will remain unchanged.`;

  return sendEmail({
    to: email,
    from: 'Flemoji <no-reply@flemoji.com>',
    subject: 'Reset your password - Flemoji',
    html,
    text,
    tags: [{ name: 'type', value: 'password-reset' }],
  });
}

export interface WelcomeEmailData {
  email: string;
  name?: string;
}

/**
 * Send a welcome email with enhanced template
 */
export async function sendWelcomeEmail({
  email,
  name,
}: WelcomeEmailData): Promise<SendEmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Flemoji</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Flemoji!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi${name ? ` ${name}` : ''},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Your email has been verified! You're all set to start your musical journey on Flemoji.
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Here's what you can do next:
          </p>
          <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
            <li>Discover amazing music from South African artists</li>
            <li>Create and share playlists</li>
            <li>Upload your own music (if you're an artist)</li>
            <li>Connect with other music lovers</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Get Started
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} Flemoji. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${name || 'there'},\n\nYour email has been verified! You're all set to start your musical journey on Flemoji.\n\nHere's what you can do next:\n- Discover amazing music from South African artists\n- Create and share playlists\n- Upload your own music (if you're an artist)\n- Connect with other music lovers\n\nGet started: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}\n\nHappy listening!\nThe Flemoji Team`;

  return sendEmail({
    to: email,
    from: 'Flemoji <no-reply@flemoji.com>',
    subject: 'Welcome to Flemoji!',
    html,
    text,
    tags: [{ name: 'type', value: 'welcome' }],
  });
}
