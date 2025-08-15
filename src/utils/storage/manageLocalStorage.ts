import { isClient } from '@/constantes';

export function getLocalStorageValue(name: string): string | null {
  return isClient ? localStorage.getItem(name) : null;
}
export const setLocalStorageValue = (key: string, value: string) => {
  isClient ? localStorage.setItem(key, value) : null;
};
export const destroyLocalStorageValue = (key: string) => {
  isClient ? localStorage.removeItem(key) : null;
};
