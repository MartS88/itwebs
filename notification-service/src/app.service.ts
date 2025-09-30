
// Nest js
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Mailtrap
import { MailtrapClient } from 'mailtrap';


@Injectable()
export class AppService {
	constructor(
		private readonly configService: ConfigService,
	) {}


	/**
	 * Sends a password recovery code to the user's email using Mailtrap.
	 *
	 * @param {string} email - The recipient's email address.
	 * @param {string} code - The recovery code to be sent.
	 * @param {string} username - The username of the recipient, used in the email content.
	 * @throws {HttpException} Throws an exception if sending the email fails.
	 * @returns {Promise<void>} Resolves if the email was sent successfully.
	 */
	async sendPasswordRecoveryCode(email: string, code: string, username: string) {
		const TOKEN = this.configService.get<string>('MAILTRAP_TOKEN') || ''

		const client = new MailtrapClient({
			token: TOKEN
		});

		const sender = {
			email: 'hello@demomailtrap.com',
			name: 'Statement-ai'
		};

		const recipients = [
			{
				email: email
			}
		];

		try {
			await client.send({
				from: sender,
				to: recipients,
				subject: 'Statement-ai user password recovery code',
				html: `
        <!doctype html>
        <html>
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          </head>
          <body style="font-family: sans-serif;">
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Password Recovery</h2>
              <p>Hello ${username},</p>
              <p>We received a request to reset your password. Please use this code to set a new password:</p>
              <p style="color: #3498db; text-decoration: none;">${code}</p>
               <p>This code is valid for the next 15 minutes.</p>
              <p>If you did not request a password reset, please ignore this email.</p>
              <br>
              <p>Best regards,</p>
              <p>Your Statement-ai Team</p>
            </div>
          </body>
        </html>
      `,
				category: 'Integration Test'
			});


		} catch (error) {
			throw new HttpException('Failed to send password recovery code', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
