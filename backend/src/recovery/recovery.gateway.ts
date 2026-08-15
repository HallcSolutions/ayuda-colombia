import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RecoveryProject } from '../common/interfaces/recovery.interface';

@WebSocketGateway({ namespace: '/recovery', cors: { origin: '*' } })
export class RecoveryGateway {
  @WebSocketServer() server!: Server;

  projectCreated(project: RecoveryProject): void {
    this.server.emit('recovery.project.created', project);
  }

  projectUpdated(project: RecoveryProject): void {
    this.server.emit('recovery.project.updated', project);
  }
}
