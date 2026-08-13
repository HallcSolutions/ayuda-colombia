import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AidAlert } from '../common/interfaces/aid-alert.interface';

@WebSocketGateway({ namespace: '/alerts', cors: { origin: '*' } })
export class AlertsGateway {
  @WebSocketServer()
  server!: Server;

  alertCreated(alert: AidAlert): void {
    this.server.emit('alert.created', alert);
  }

  alertResolved(alert: AidAlert): void {
    this.server.emit('alert.resolved', alert);
  }
}
