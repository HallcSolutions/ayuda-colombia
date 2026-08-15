/** Imagen incrustada en el mensaje: se ve aunque el cliente bloquee lo remoto. */
export interface EmailAttachment {
  filename: string;
  path: string;
  cid: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}
