import { HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/helpers/query.helper';
import Events from '@/components/events/Events';
import { dehydrate } from '@tanstack/react-query';

export default function EventsPage() {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Events />
    </HydrationBoundary>
  );
}
