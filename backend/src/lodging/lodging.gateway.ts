import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { LodgingOffer } from '../common/interfaces/lodging-offer.interface';

@WebSocketGateway({ namespace: '/lodging', cors: { origin: '*' } })
export class LodgingGateway {
  @WebSocketServer()
  server!: Server;

  offerCreated(offer: LodgingOffer): void {
    this.server.emit('lodging.created', offer);
  }

  offerUpdated(offer: LodgingOffer): void {
    this.server.emit('lodging.updated', offer);
  }
}
