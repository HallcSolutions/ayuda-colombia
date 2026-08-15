import {
  HelpContactChannel,
  HelpContactRole,
} from '../constants/app.constants';

/** Datos que el contacto autorizó expresamente para hablar con quien ofrece ayuda. */
export interface DirectHelpContact {
  name: string;
  phone: string;
  role: HelpContactRole;
  channel: HelpContactChannel;
}
