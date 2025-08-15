import { kyInstanceClient } from '@/helpers/kyClient.helper';
import { kyInstanceServer } from '@/helpers/kyServer.helper';
import { IUser } from '@/types/models';
import { queryOptions } from '@tanstack/react-query';

export const pokemonOptions = queryOptions({
  queryKey: ['pokemon'],
  queryFn: async () => {
    const response = await kyInstanceServer.get('/api/pokemon/25');

    return response.json();
  },
});

const key = 'users';

interface IUserCount {
  total: number;
}
interface IUserList {
  items: IUser[];
}
export const countOnlyUsers = queryOptions({
  queryKey: [key],
  queryFn: async () => {
    const response = await kyInstanceClient
      .get<IUserCount>('users?countOnly=true')
      .json();

    return response;
  },
});

export const users = queryOptions({
  queryKey: [key],
  queryFn: async () => {
    const response = await kyInstanceClient
      .get<IUserList & IUserCount>('users?page=1&limit=5')
      .json();

    return response;
  },
});
