import { kyInstanceClient } from '@/helpers/kyClient.helper';
import { kyInstanceServer } from '@/helpers/kyServer.helper';
import { IEvent } from '@/types/models';
import { queryOptions } from '@tanstack/react-query';

const key = 'events';
interface IEventCount {
  total: number;
}
interface IEventList {
  items: IEvent[];
}

export const countOnlyEvents = queryOptions({
  queryKey: [key],
  queryFn: async () => {
    const response = await kyInstanceClient
      .get<IEventCount>('events?countOnly=true')
      .json();
    return response;
  },
});

export const events = queryOptions({
  queryKey: [key],
  queryFn: async () => {
    const response = await kyInstanceClient
      .get<IEventList & IEventCount>('events?page=1&limit=5')
      .json();

    return response;
  },
});
