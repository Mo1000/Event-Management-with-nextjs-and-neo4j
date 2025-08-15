export const CONFIG_ENV: Record<string, string> = {
  NEXT_PUBLIC_API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? ('http://localhost:3000' as string),
};
