
// Nest js
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Mailtrap
import { MailtrapClient } from 'mailtrap';

// Types
import { SendPasswordCodePayload, SendWelcomeMessage } from './types';

@Injectable()
export class NotificationService {
  private readonly TOKEN: string;

  constructor(private readonly configService: ConfigService) {
    this.TOKEN = this.configService.get<string>('MAILTRAP_TOKEN') || '';
  }

  /**
   * Sends a welcome email to a newly registered user via Mailtrap.
   *
   * The email contains a greeting message and a link to the user dashboard.
   * It does not require activation — this is a post-registration notification only.
   *
   * @async
   * @function sendWelcomeMessage
   * @param {Object} payload - The data needed to send the email.
   * @param {string} payload.email - The recipient's email address.
   * @param {string} payload.username - The recipient's display name.
   *
   * @throws {HttpException} If the email fails to send.
   */
  async sendWelcomeMessage({ email, username }: SendWelcomeMessage) {
    const client = new MailtrapClient({
      token: this.TOKEN,
    });

    const sender = {
      email: 'hello@decryptor.cloud',
      name: 'Statement-ai',
    };

    const recipients = [
      {
        email: email,
      },
    ];

    try {
      await client.send({
        from: sender,
        to: recipients,
        subject: 'Welcome to Statement-ai – We’re glad you joined!',
        html: `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Welcome to Statement-ai</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
  <table width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 30px; text-align: center;">
        <h2 style="color: #333;">Welcome to <span style="color: #4B8DF8;">Statement-ai</span>!</h2>

       <p style="font-size: 16px; color: #555;">
  		Hello <strong>${username}</strong>,
			</p>
			
        <p style="font-size: 16px; color: #555;">
          Thank you for registering with Statement-ai. Your account has been successfully created, and you're now ready to start automating your legal documents.
        </p>

        <p style="font-size: 16px; color: #555;">
          If you have any questions or need assistance, just reply to this email. We're here to help.
        </p>

        <div style="margin-top: 30px;">
          <a href="https://decryptor.cloud" style="background-color: #4B8DF8; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 16px;">
            Go to your dashboard
          </a>
        </div>

        <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />

        <p style="font-size: 12px; color: #999;">
          This is an automated message. If you did not sign up for Statement-ai, please ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
        category: 'Integration Test',
      });


    } catch (error) {
      throw new HttpException('Failed to send welcome message', HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }

  /**
   * Sends a password recovery code to the user's email using Mailtrap.
   *
   * @param {string} email - The recipient's email address.
   * @param {string} code - The recovery code to be sent.
   * @param {string} username - The username of the recipient, used in the email content.
   * @throws {HttpException} Throws an exception if sending the email fails.
   * @returns {Promise<void>} Resolves if the email was sent successfully.
   */
  async sendPasswordRecoveryCode({ email, code, username }: SendPasswordCodePayload) {

    const client = new MailtrapClient({
      token: this.TOKEN,
    });

    const sender = {
      email: 'hello@decryptor.cloud',
      name: 'Statement-ai',
    };

    const recipients = [
      {
        email: email,
      },
    ];

    try {
      await client.send({
        from: sender,
        to: recipients,
        subject: 'Statement-ai user password recovery code',
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Password Recovery - Statement-ai</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <table width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding: 30px; text-align: center;">
            <h2 style="color: #333;">Password Recovery – <span style="color: #4B8DF8;">Statement-ai</span></h2>

            <p style="font-size: 16px; color: #555;">
              Hello <strong>${username}</strong>,
            </p>

            <p style="font-size: 16px; color: #555;">
              You have requested to reset your password. Use the following code to proceed:
            </p>

            <div style="margin: 20px auto; display: inline-block; background-color: #f0f0f0; padding: 16px 24px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #333;">
              ${code}
            </div>

            <p style="font-size: 14px; color: #888; margin-top: 20px;">
              This code is valid for a limited time. If you didn’t request a password reset, please ignore this email.
            </p>

            <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />

            <p style="font-size: 12px; color: #999;">
              This is an automated message from Statement-ai. Do not reply to this email directly.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>`,
        category: 'Integration Test',
      });


    } catch (error) {
      throw new HttpException('Failed to send password recovery code', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
