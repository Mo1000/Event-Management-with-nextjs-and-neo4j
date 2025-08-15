import { kyInstanceClient } from '@/helpers/kyClient.helper';
import { kyInstanceServer } from '@/helpers/kyServer.helper';
import { ITicket } from '@/types/models';
import { queryOptions } from '@tanstack/react-query';

const key = 'tickets';

interface ITicketCount {
  total: number;
}
interface ITicketList {
  items: ITicket[];
}
export const countOnlyTickets = queryOptions({
  queryKey: [key],
  queryFn: async () => {
    const response = await kyInstanceClient
      .get<ITicketCount>('tickets?countOnly=true')
      .json();

    return response;
  },
});
