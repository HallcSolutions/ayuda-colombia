import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NeedsDigest } from '../common/interfaces/needs-digest.interface';

@WebSocketGateway({ namespace: '/monitoring', cors: { origin: '*' } })
export class MonitoringGateway {
  @WebSocketServer()
  server!: Server;

  digestCreated(digest: NeedsDigest): void {
    this.server.emit('digest.created', digest);
  }
}
