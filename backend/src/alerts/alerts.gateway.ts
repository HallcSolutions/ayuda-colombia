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

  /** Se retiró una necesidad y la alerta sigue abierta con lo que falta. */
  alertUpdated(alert: AidAlert): void {
    this.server.emit('alert.updated', alert);
  }

  alertResolved(alert: AidAlert): void {
    this.server.emit('alert.resolved', alert);
  }
}
