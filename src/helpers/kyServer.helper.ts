'use server';
import { TOKEN_COOKIE_NAME } from '@/constantes';
import { CONFIG_ENV } from '@/constantes/configuration';
import ky from 'ky';
import { cookies } from 'next/headers';

const API_BASE_URL = CONFIG_ENV.NEXT_PUBLIC_API_BASE_URL.concat('/api');

/* eslint-disable  @typescript-eslint/no-explicit-any */
function getCustomFetch() {
  return ky.extend({
    prefixUrl: API_BASE_URL,
    timeout: 60000,
    credentials: 'include',
    hooks: {
      beforeRequest: [
        async (request) => {
          const cookiesServer = await cookies();
          const accessToken = cookiesServer.get(TOKEN_COOKIE_NAME)?.value;

          if (accessToken)
            request.headers.set('Authorization', `Bearer ${accessToken}`);
        },
      ],
    },
  });
}

export const kyInstanceServer = getCustomFetch();
