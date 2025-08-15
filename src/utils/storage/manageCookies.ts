import Cookies from 'js-cookie';

export function getCookieValue(name: string): string | undefined {
  return Cookies.get(name);
}

export const setCookieValue = (
  key: string,
  value: string,
  options?: Cookies.CookieAttributes,
) => {
  Cookies.set(key, value, { ...options });
};
export const removeCookie = (name: string) => {
  Cookies.remove(name);
};
