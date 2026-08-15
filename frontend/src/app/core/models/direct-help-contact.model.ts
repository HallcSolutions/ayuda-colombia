import { HelpContactChannel, HelpContactRole } from '../constants/app.constants';

export interface DirectHelpContact {
  name: string;
  phone: string;
  role: HelpContactRole;
  channel: HelpContactChannel;
}
