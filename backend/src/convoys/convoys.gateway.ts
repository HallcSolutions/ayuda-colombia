import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ConvoyTrip } from '../common/interfaces/convoy-trip.interface';

@WebSocketGateway({ namespace: '/convoys', cors: { origin: '*' } })
export class ConvoysGateway {
  @WebSocketServer()
  server!: Server;

  tripCreated(trip: ConvoyTrip): void {
    this.server.emit('convoy.created', trip);
  }

  /** Cada señal del camión: es lo que mantiene el mapa vivo en el acopio. */
  tripMoved(trip: ConvoyTrip): void {
    this.server.emit('convoy.moved', trip);
  }

  tripUpdated(trip: ConvoyTrip): void {
    this.server.emit('convoy.updated', trip);
  }
}
