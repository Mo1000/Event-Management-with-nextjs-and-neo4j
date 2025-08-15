import { isClient, TOKEN_COOKIE_NAME } from '@/constantes';
import { CONFIG_ENV } from '@/constantes/configuration';
import { getCookieValue } from '@/utils/storage/manageCookies';
import ky from 'ky';

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
          const accessToken = getCookieValue(TOKEN_COOKIE_NAME);

          if (accessToken)
            request.headers.set('Authorization', `Bearer ${accessToken}`);
        },
      ],
      afterResponse: [
        async (request, options, response) => {
          if (response.status === 401) {
            if (isClient) window.location.href = window.location.origin;
          }

          return response;
        },
      ],
    },
  });
}

export const kyInstanceClient = getCustomFetch();
