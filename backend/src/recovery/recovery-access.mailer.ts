import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { EmailAttachment } from '../common/email/email.interface';
import { EmailService } from '../common/email/email.service';
import { RecoveryAccessEntry } from '../common/interfaces/recovery.interface';

/** Motivo por el que se envía el código: recién publicado o recuperado por correo. */
export type RecoveryAccessReason = 'published' | 'recovered';

/** Los mismos colores y la misma tipografía de la página, escritos en línea. */
const INK = '#17231d';
const GREEN = '#125840';
const MUTED = '#68756e';
const LINE = '#e0e4de';
const PAPER = '#f8f9f6';
const SANS = "Inter,'Segoe UI',Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

/**
 * El escudo de RedAyuda viaja dentro del mensaje: si se enlazara al sitio, los
 * clientes de correo lo bloquearían y la marca desaparecería. En desarrollo el SPA
 * todavía no está junto al API, así que el encabezado se queda solo con el nombre.
 */
const LOGO_PATH = join(
  process.cwd(),
  'client',
  'assets',
  'brand',
  'redayuda-mark-192.png',
);
const LOGO_CID = 'redayuda-marca';

const SITE_URL = (): string =>
  process.env.FRONTEND_URL?.trim() || 'https://redayudacolombia.com';

const INTRO: Record<RecoveryAccessReason, string> = {
  published:
    'Guarda este correo: es la única copia de tu PIN. Lo necesitarás para revisar quién se ofrece a ayudarte, añadir lo que te falta y cerrar tu caso.',
  recovered:
    'Pediste recuperar tu acceso. Generamos un PIN nuevo para cada publicación registrada con este correo; el PIN anterior ya no funciona.',
};

const TITLE: Record<RecoveryAccessReason, string> = {
  published: 'Tu código y tu PIN',
  recovered: 'Tu acceso recuperado',
};

const SUBJECT: Record<RecoveryAccessReason, string> = {
  published: 'RedAyuda · tu código y tu PIN',
  recovered: 'RedAyuda · tu acceso recuperado',
};

/** El nombre del caso lo escribe quien publica: nunca se pega crudo en el HTML. */
const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  );

/**
 * Entrega por correo el código y el PIN de una publicación. El PIN solo se guarda
 * cifrado, así que este mensaje es la única forma de recuperarlo sin perder el caso.
 */
@Injectable()
export class RecoveryAccessMailer {
  private readonly logo: EmailAttachment[] = existsSync(LOGO_PATH)
    ? [{ filename: 'redayuda.png', path: LOGO_PATH, cid: LOGO_CID }]
    : [];

  constructor(private readonly email: EmailService) {}

  get available(): boolean {
    return this.email.available;
  }

  sendAccess(
    to: string,
    entries: RecoveryAccessEntry[],
    reason: RecoveryAccessReason,
  ): Promise<boolean> {
    if (!to || !entries.length) return Promise.resolve(false);
    return this.email.send({
      to,
      subject: SUBJECT[reason],
      html: this.body(entries, reason),
      attachments: this.logo,
    });
  }

  private body(
    entries: RecoveryAccessEntry[],
    reason: RecoveryAccessReason,
  ): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:26px 12px;background:${PAPER};font-family:${SANS};color:${INK}">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:#ffffff">
        <tr><td style="padding:28px 30px 0">${this.brand()}</td></tr>
        <tr><td style="padding:22px 30px 0">
          <h1 style="margin:0;font:700 26px/1.2 ${SERIF};color:${INK}">${TITLE[reason]}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:${INK}">${INTRO[reason]}</p>
        </td></tr>
        <tr><td style="padding:24px 30px 0">${entries.map((entry) => this.entryBlock(entry)).join('')}</td></tr>
        <tr><td style="padding:6px 30px 0">${this.action()}</td></tr>
        <tr><td style="padding:26px 30px 30px">${this.footer()}</td></tr>
      </table>
    </td>
  </tr>
</table>`;
  }

  private brand(): string {
    const mark = this.logo.length
      ? `<td width="48" style="padding-right:13px" valign="middle"><img src="cid:${LOGO_CID}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border:0" /></td>`
      : '';
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      ${mark}
      <td valign="middle">
        <div style="font:700 21px/1 ${SERIF};color:${GREEN}">RedAyuda</div>
        <div style="margin-top:5px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${MUTED}">Colombia se cuida</div>
      </td>
    </tr></table>`;
  }

  /** Una línea vertical verde destaca el dato, sin encerrarlo en un recuadro. */
  private entryBlock(entry: RecoveryAccessEntry): string {
    return `<div style="margin-bottom:20px;padding:2px 0 2px 15px;border-left:3px solid ${GREEN}">
      <div style="font:700 17px/1.3 ${SERIF};color:${INK}">${escapeHtml(entry.title)}</div>
      <div style="margin-top:12px;font-size:10px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:${MUTED}">${escapeHtml(entry.codeLabel)}</div>
      <div style="margin-top:3px;font-family:Consolas,Menlo,monospace;font-size:14px;color:#3c4a43;word-break:break-all">${escapeHtml(entry.code)}</div>
      <div style="margin-top:12px;font-size:10px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:${MUTED}">PIN</div>
      <div style="margin-top:2px;font:700 34px/1 ${SERIF};letter-spacing:.16em;color:${INK}">${escapeHtml(entry.pin)}</div>
    </div>`;
  }

  private action(): string {
    return `<a href="${SITE_URL()}/recuperacion" style="display:inline-block;padding:14px 26px;border-radius:999px;background:${GREEN};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Abrir mi caso en RedAyuda</a>`;
  }

  private footer(): string {
    return `<div style="padding-top:18px;border-top:1px solid ${LINE};font-size:13px;line-height:1.6;color:${MUTED}">
      <p style="margin:0">Nadie de RedAyuda te pedirá este PIN por teléfono ni por WhatsApp. Si no reconoces esta solicitud, ignora el mensaje: tu publicación no cambia.</p>
      <p style="margin:10px 0 0"><a href="${SITE_URL()}" style="color:${GREEN};text-decoration:underline">redayudacolombia.com</a> · Red de ayuda tras el terremoto</p>
    </div>`;
  }
}
