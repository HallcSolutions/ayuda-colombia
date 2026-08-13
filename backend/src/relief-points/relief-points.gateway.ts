import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ReliefPoint } from '../common/interfaces/relief-point.interface';

@WebSocketGateway({ namespace: '/relief-points', cors: { origin: '*' } })
export class ReliefPointsGateway {
  @WebSocketServer()
  server!: Server;

  pointCreated(point: ReliefPoint): void {
    this.server.emit('relief-point.created', point);
  }

  pointUpdated(point: ReliefPoint): void {
    this.server.emit('relief-point.updated', point);
  }
}
