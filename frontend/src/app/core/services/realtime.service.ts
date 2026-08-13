import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';

/** Handlers de un namespace: nombre de evento -> callback con el payload recibido. */
export type RealtimeHandlers<T> = Record<string, (payload: T) => void>;

/** Cliente compartido de socket.io: un único socket por namespace. */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly sockets = new Map<string, Socket>();

  listen<T>(namespace: string, handlers: RealtimeHandlers<T>): void {
    const socket = this.sockets.get(namespace) ?? io(namespace);
    this.sockets.set(namespace, socket);
    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
  }

  disconnect(namespace: string): void {
    this.sockets.get(namespace)?.disconnect();
    this.sockets.delete(namespace);
  }
}
