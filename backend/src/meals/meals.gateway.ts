import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MealService } from '../common/interfaces/meal-service.interface';

@WebSocketGateway({ namespace: '/meals', cors: { origin: '*' } })
export class MealsGateway {
  @WebSocketServer()
  server!: Server;

  mealServiceCreated(mealService: MealService): void {
    this.server.emit('meal-service.created', mealService);
  }

  mealServiceUpdated(mealService: MealService): void {
    this.server.emit('meal-service.updated', mealService);
  }
}
