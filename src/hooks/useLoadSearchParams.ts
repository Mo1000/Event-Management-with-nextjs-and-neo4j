import React from 'react';
import { parseAsInteger, useQueryState, UseQueryStateOptions } from 'nuqs';

export const useLoadSearchParams = (
  options?: Partial<{
    handleTransition: {
      isLoading: boolean;
      startTransition: React.TransitionStartFunction;
    };
  }>,
) => {
  const [isLoading, startTransition] = React.useTransition();
  const initialSearchParamsVal: Partial<UseQueryStateOptions<any>> = {
    clearOnDefault: true,
    shallow: false,
    startTransition:
      options?.handleTransition?.startTransition || startTransition,
  };

  const [searchTerm, setSearchTerm] = useQueryState('q', {
    defaultValue: '',
    ...initialSearchParamsVal,
  });

  const [limit, setLimit] = useQueryState(
    'limit',
    parseAsInteger.withDefault(20).withOptions(initialSearchParamsVal),
  );
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(0).withOptions(initialSearchParamsVal),
  );
  // const [eventType, setEventType] = useQueryState<EventTypeEnum>(
  //   'eventType',
  //   parseAsStringEnum(convertEnumToStringList(EventTypeEnum))
  //     .withDefault(EventTypeEnum.ALL)
  //     .withOptions(initialSearchParamsVal),
  // );
  // const [category, setCategory] = useQueryState<CategoryEventEnum>(
  //   'category',
  //   parseAsStringEnum(convertEnumToStringList(CategoryEventEnum))
  //     .withDefault(CategoryEventEnum.All)
  //     .withOptions(initialSearchParamsVal),
  // );
  return {
    initialSearchParamsVal,
    isLoading: options?.handleTransition?.isLoading || isLoading,
    limit,
    setLimit,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
  };
};

export const eventsSearchParams = () => {
  const [isLoading, startTransition] = React.useTransition();
  const { initialSearchParamsVal, ...rest } = useLoadSearchParams({
    handleTransition: {
      isLoading,
      startTransition,
    },
  });
  const [from, setFrom] = useQueryState('from', initialSearchParamsVal);
  const [to, setTo] = useQueryState('to', initialSearchParamsVal);
  return {
    ...rest,
    from,
    setFrom,
    to,
    setTo,
  };
};
