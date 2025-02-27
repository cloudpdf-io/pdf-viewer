type EventCallback = (data: any) => void;

export class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return cleanup function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  removeListener(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }
}