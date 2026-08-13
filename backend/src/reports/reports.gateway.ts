import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { HouseReport } from '../common/interfaces/house-report.interface';

@WebSocketGateway({ namespace: '/reports', cors: { origin: '*' } })
export class ReportsGateway {
  @WebSocketServer()
  server!: Server;

  reportCreated(report: HouseReport): void {
    this.server.emit('report.created', report);
  }

  reportUpdated(report: HouseReport): void {
    this.server.emit('report.updated', report);
  }
}
