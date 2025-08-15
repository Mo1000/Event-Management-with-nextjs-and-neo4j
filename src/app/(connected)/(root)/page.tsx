import Dashboard from '@/components/dashboard/Dashboard';
import { getQueryClient } from '@/helpers/query.helper';
import { countOnlyEvents, events } from '@/services/queries/event.query';
import { countOnlyTickets } from '@/services/queries/ticket.query';
import { countOnlyUsers, users } from '@/services/queries/user.query';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default function DashboardPage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(countOnlyEvents);
  void queryClient.prefetchQuery(countOnlyUsers);
  void queryClient.prefetchQuery(countOnlyTickets);
  void queryClient.prefetchQuery(events);
  void queryClient.prefetchQuery(users);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Dashboard />
    </HydrationBoundary>
  );
}
