import { setBaseUrl } from "@workspace/api-client-react";

export function getApiUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

export function getPhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http")) return photoUrl;
  return `${getApiUrl()}/api/storage${photoUrl}`;
}

setBaseUrl(getApiUrl());
