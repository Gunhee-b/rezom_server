import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface ConceptUpdateEvent {
  type: 'concept-update';
  conceptSlug: string;
  timestamp: number;
  data?: any;
}

@Injectable()
export class EventsService {
  private conceptUpdatesSubject = new Subject<ConceptUpdateEvent>();

  // Observable for concept updates
  get conceptUpdates$() {
    return this.conceptUpdatesSubject.asObservable();
  }

  // Emit concept update event
  emitConceptUpdate(conceptSlug: string, data?: any) {
    const event: ConceptUpdateEvent = {
      type: 'concept-update',
      conceptSlug,
      timestamp: Date.now(),
      data,
    };
    this.conceptUpdatesSubject.next(event);
  }

  // Get SSE stream for a specific concept
  getConceptUpdateStream(conceptSlug: string) {
    return this.conceptUpdates$.pipe(
      // Filter events for specific concept
      // Note: we can't use rxjs operators here to maintain Node.js compatibility
    );
  }
}