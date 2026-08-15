import { Injectable, Logger } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer';
import { EmailMessage } from './email.interface';

const SECURE_PORT = 465;

/**
 * Única salida de correo de la API. Sin `EMAIL_HOST`, `EMAIL_USER` y `EMAIL_PASS`
 * queda desactivada: nada se envía y `available` lo dice, para que quien la use
 * pueda avisarlo en vez de aparentar un envío que nunca ocurrió.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter = this.createTransporter();

  get available(): boolean {
    return this.transporter !== null;
  }

  async send(message: EmailMessage): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Correo sin configurar: no se envió ningún mensaje');
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: `"RedAyuda" <${process.env.EMAIL_USER}>`,
        ...message,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `No fue posible enviar el correo: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private createTransporter(): Transporter | null {
    const host = process.env.EMAIL_HOST?.trim();
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS;
    if (!host || !user || !pass) return null;
    const port = Number(process.env.EMAIL_PORT ?? SECURE_PORT);
    return createTransport({
      host,
      port,
      secure: port === SECURE_PORT,
      auth: { user, pass },
      tls: {
        rejectUnauthorized:
          process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
      },
      // El contenedor puede quedarse esperando a un servidor de correo caído.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
}
