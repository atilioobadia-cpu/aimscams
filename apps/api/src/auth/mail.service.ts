import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

export interface PasswordResetMail {
  to: string;
  recipientName: string;
  resetUrl: string;
  expiresMinutes: number;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER?.trim();
    const password = process.env.SMTP_PASSWORD;
    this.from = process.env.MAIL_FROM?.trim() || 'no-reply@aimscams.local';

    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number.isFinite(port) ? port : 587,
          secure: port === 465,
          requireTLS: port !== 465,
          ...(user ? { auth: { user, pass: password ?? '' } } : {}),
          tls: { minVersion: 'TLSv1.2' },
        })
      : null;
  }

  get configured(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordReset(input: PasswordResetMail): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP is not configured.');
    }

    const name = escapeHtml(input.recipientName);
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: 'Reset your AIMSCAMS password',
      text: [
        `Hello ${input.recipientName},`,
        '',
        'A password reset was requested for your AIMSCAMS account.',
        `Open this link within ${input.expiresMinutes} minutes:`,
        input.resetUrl,
        '',
        'If you did not request this, ignore the message. Your current password remains active.',
        '',
        'AIMSCAMS',
      ].join('\n'),
      html: [
        `<p>Hello ${name},</p>`,
        '<p>A password reset was requested for your AIMSCAMS account.</p>',
        `<p><a href="${escapeHtml(input.resetUrl)}">Reset your password</a> (valid for ${input.expiresMinutes} minutes).</p>`,
        '<p>If you did not request this, ignore the message. Your current password remains active.</p>',
        '<p>AIMSCAMS</p>',
      ].join(''),
    });
    this.logger.log(
      `Password reset message accepted for delivery to ${input.to}.`,
    );
  }
}
