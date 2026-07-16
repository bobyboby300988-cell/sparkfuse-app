import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { useGetCurrentAuthUser, useActivateSubscription } from "@workspace/api-client-react";
import { useAuth } from "@clerk/expo";
import { checkPendingWebTokenCheckout } from "@/config/payments";
import { getApiUrl } from "@/lib/api";

export interface MyPhoto {
  id: string;
  uri: string;
  exclusive: boolean;
  type: "image" | "video";
}

export interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  timestamp: number;
  mediaUri?: string;
  mediaType?: "image" | "video" | "voice";
  voiceDuration?: number;
}

export interface Match {
  profileId: string;
  matchedAt: number;
  messages: Message[];
  name?: string;
  photoUri?: string | null;
}

export type AppMode = "dating" | "naughty" | "business" | "party" | "travel" | "social";

interface AppContextType {
  isLoaded: boolean;
  isSubscribed: boolean;
  myPhotos: MyPhoto[];
  addMyPhoto: (uri: string, exclusive: boolean, type?: "image" | "video") => void;
  removeMyPhoto: (id: string) => void;
  togglePhotoExclusive: (id: string) => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  setSubscribed: () => Promise<void>;
  matches: Match[];
  addMatch: (profileId: string, name?: string, photoUri?: string | null) => void;
  sendMessage: (profileId: string, text: string) => void;
  sendMedia: (profileId: string, uri: string, type: "image" | "video") => void;
  sendVoice: (profileId: string, uri: string, duration: number) => void;
  removeMatch: (profileId: string) => void;
  clearMessages: (profileId: string) => void;
  resetLocalState: () => Promise<void>;
  unlockedPhotos: string[];
  unlockPhoto: (photoId: string) => void;
  creatorMode: boolean;
  creatorPrice: number;
  setCreatorMode: (on: boolean) => Promise<void>;
  setCreatorPrice: (price: number) => Promise<void>;
  earnings: number;
  addEarning: (amountEur: number) => void;
  clearEarnings: () => Promise<void>;
  coinBalance: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => void;
  deletedMatchIds: string[];
  isLive: boolean;
  setIsLive: (on: boolean) => Promise<void>;
  stripeConnectAccountId: string | null;
  setStripeConnectAccountId: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const KEYS = {
  MATCHES: "@spark/matches",
  SUBSCRIBED: "@spark/subscribed",
  UNLOCKED_PHOTOS: "@spark/unlocked_photos",
  CREATOR_MODE: "@spark/creator_mode",
  CREATOR_PRICE: "@spark/creator_price",
  EARNINGS: "@spark/earnings",
  PENDING_COINS: "@spark/pending_coins_credit",
  COINS: "@spark/coins",
  DELETED_MATCHES: "@spark/deleted_matches",
  IS_LIVE: "@spark/is_live",
  STRIPE_CONNECT_ACCOUNT_ID: "@spark/stripe_connect_account_id",
  MY_PHOTOS: "@spark/my_photos",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubscribed, setIsSubscribedState] = useState(false);
  const [appMode, setAppModeState] = useState<AppMode>("dating");
  const [unlockedPhotos, setUnlockedPhotos] = useState<string[]>([]);
  const [creatorMode, setCreatorModeState] = useState(false);
  const [creatorPrice, setCreatorPriceState] = useState(3);
  const [earnings, setEarnings] = useState(0);
  const [coinBalance, setCoinBalance] = useState(0);
  const [isLive, setIsLiveState] = useState(false);
  const [stripeConnectAccountId, setStripeConnectAccountIdState] = useState<string | null>(null);
  const [myPhotos, setMyPhotos] = useState<MyPhoto[]>([]);
  const [deletedMatchIds, setDeletedMatchIds] = useState<string[]>([]);

  const { isSignedIn, getToken } = useAuth();
  const { data: authUserData } = useGetCurrentAuthUser({
    query: { enabled: !!isSignedIn, queryKey: ["currentAuthUser"] },
  });
  const activateSubscriptionMutation = useActivateSubscription();

  // Server is the definitive source of truth for subscription status when the
  // user is signed in. If the server says the subscription lapsed (failed
  // payment or cancellation), clear local storage and block access immediately.
  useEffect(() => {
    if (!authUserData?.user) return;
    const serverSubscribed = authUserData.user.isSubscribed;
    setIsSubscribedState(serverSubscribed);
    if (serverSubscribed) {
      AsyncStorage.setItem(KEYS.SUBSCRIBED, "true");
    } else {
      AsyncStorage.removeItem(KEYS.SUBSCRIBED);
    }
  }, [authUserData?.user?.isSubscribed]);

  useEffect(() => {
    async function load() {
      try {
        const [matchesRaw, subscribedRaw, unlockedRaw, creatorModeRaw, creatorPriceRaw, earningsRaw, coinsRaw, isLiveRaw, stripeConnectAccountIdRaw, myPhotosRaw] = await Promise.all([
          AsyncStorage.getItem(KEYS.MATCHES),
          AsyncStorage.getItem(KEYS.SUBSCRIBED),
          AsyncStorage.getItem(KEYS.UNLOCKED_PHOTOS),
          AsyncStorage.getItem(KEYS.CREATOR_MODE),
          AsyncStorage.getItem(KEYS.CREATOR_PRICE),
          AsyncStorage.getItem(KEYS.EARNINGS),
          AsyncStorage.getItem(KEYS.COINS),
          AsyncStorage.getItem(KEYS.IS_LIVE),
          AsyncStorage.getItem(KEYS.STRIPE_CONNECT_ACCOUNT_ID),
          AsyncStorage.getItem(KEYS.MY_PHOTOS),
        ]);
        if (matchesRaw) setMatches(JSON.parse(matchesRaw));
        if (subscribedRaw === "true") setIsSubscribedState(true);
        if (unlockedRaw) setUnlockedPhotos(JSON.parse(unlockedRaw));
        if (myPhotosRaw) setMyPhotos(JSON.parse(myPhotosRaw));
        if (creatorModeRaw === "true") setCreatorModeState(true);
        if (creatorPriceRaw) setCreatorPriceState(Number(creatorPriceRaw));
        if (earningsRaw) setEarnings(parseFloat(earningsRaw));
        if (coinsRaw) setCoinBalance(parseFloat(coinsRaw));
        const deletedRaw = await AsyncStorage.getItem(KEYS.DELETED_MATCHES);
        if (deletedRaw) setDeletedMatchIds(JSON.parse(deletedRaw));
        if (isLiveRaw === "true") setIsLiveState(true);
        if (stripeConnectAccountIdRaw) setStripeConnectAccountIdState(stripeConnectAccountIdRaw);
      } catch {
        // ignore storage errors
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  // Sync earnings, coin balance, and subscription from server when signed in.
  // Triggered on authUserData.user.id so Clerk is fully ready and getToken() works.
  useEffect(() => {
    if (!authUserData?.user?.id) return;
    async function syncServerData() {
      try {
        const token = await getToken();
        const base = getApiUrl();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        // Flush any pending coin credit saved before auth was ready
        const pendingCoins = await AsyncStorage.getItem(KEYS.PENDING_COINS);
        if (pendingCoins) {
          const amount = parseFloat(pendingCoins);
          await AsyncStorage.removeItem(KEYS.PENDING_COINS);
          if (amount > 0) {
            await fetch(`${base}/api/coins/add`, {
              method: "POST",
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({ amount }),
            });
          }
        }

        // Check for pending subscription success redirect
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("stripe_sub") === "success") {
            window.history.replaceState({}, "", window.location.pathname);
            try {
              const restoreRes = await fetch(`${base}/api/subscription/restore`, {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
              });
              if (restoreRes.ok) {
                const data = await restoreRes.json();
                if (data.restored) {
                  setIsSubscribedState(true);
                  await AsyncStorage.setItem(KEYS.SUBSCRIBED, "true");
                }
              }
            } catch {}
          }
        }

        const [earningsRes, coinsRes] = await Promise.all([
          fetch(`${base}/api/gifts/earnings`, { headers }),
          fetch(`${base}/api/coins`, { headers }),
        ]);

        if (earningsRes.ok) {
          const data = (await earningsRes.json()) as { earnings: number };
          setEarnings(data.earnings);
          AsyncStorage.setItem(KEYS.EARNINGS, String(data.earnings));
        }
        if (coinsRes.ok) {
          const data = (await coinsRes.json()) as { coinBalance: number };
          setCoinBalance(data.coinBalance);
          AsyncStorage.setItem(KEYS.COINS, String(data.coinBalance));
        }
      } catch {
        // ignore — local values stay
      }
    }
    syncServerData();
  }, [authUserData?.user?.id]);

  // On web, Stripe Checkout redirects back with a real page reload. We verify
  // the session here (URL params available immediately), but save the tokens to
  // AsyncStorage so we can credit them server-side once Clerk auth loads.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    checkPendingWebTokenCheckout()
      .then((result) => {
        if (!result) return;
        // Stash pending credit — will be applied once isSignedIn becomes true
        AsyncStorage.setItem(KEYS.PENDING_COINS, String(result.tokens));
      })
      .catch(() => {});
  }, []);

  const setSubscribed = async () => {
    setIsSubscribedState(true);
    await AsyncStorage.setItem(KEYS.SUBSCRIBED, "true");
    try {
      await activateSubscriptionMutation.mutateAsync();
    } catch {
      // Local state is already updated optimistically; the next successful
      // auth/user fetch (or a retried activation) will reconcile the server.
    }
  };

  const addMatch = (profileId: string, name?: string, photoUri?: string | null) => {
    setMatches((prev) => {
      const existing = prev.find((m) => m.profileId === profileId);
      if (existing) {
        // Update name/photo if we now have them and didn't before
        if ((name && !existing.name) || (photoUri && !existing.photoUri)) {
          const updated = prev.map((m) =>
            m.profileId === profileId
              ? { ...m, name: name ?? m.name, photoUri: photoUri ?? m.photoUri }
              : m
          );
          AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(updated));
          return updated;
        }
        return prev;
      }
      const updated = [...prev, { profileId, matchedAt: Date.now(), messages: [], name, photoUri }];
      AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(updated));
      return updated;
    });
  };

  const sendMessage = (profileId: string, text: string) => {
    setMatches((prev) => {
      const updated = prev.map((m) => {
        if (m.profileId !== profileId) return m;
        const newMsg: Message = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          text,
          fromMe: true,
          timestamp: Date.now(),
        };
        return { ...m, messages: [...m.messages, newMsg] };
      });
      AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(updated));
      return updated;
    });
  };

  const sendMedia = (profileId: string, uri: string, type: "image" | "video") => {
    setMatches((prev) => {
      const updated = prev.map((m) => {
        if (m.profileId !== profileId) return m;
        const newMsg: Message = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          text: "",
          fromMe: true,
          timestamp: Date.now(),
          mediaUri: uri,
          mediaType: type,
        };
        return { ...m, messages: [...m.messages, newMsg] };
      });
      AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(updated));
      return updated;
    });
  };

  const sendVoice = (profileId: string, uri: string, duration: number) => {
    setMatches((prev) => {
      const updated = prev.map((m) => {
        if (m.profileId !== profileId) return m;
        const newMsg: Message = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          text: "",
          fromMe: true,
          timestamp: Date.now(),
          mediaUri: uri,
          mediaType: "voice",
          voiceDuration: duration,
        };
        return { ...m, messages: [...m.messages, newMsg] };
      });
      AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(updated));
      return updated;
    });
  };

  const unlockPhoto = (photoId: string) => {
    setUnlockedPhotos((prev) => {
      if (prev.includes(photoId)) return prev;
      const updated = [...prev, photoId];
      AsyncStorage.setItem(KEYS.UNLOCKED_PHOTOS, JSON.stringify(updated));
      return updated;
    });
  };

  const setCreatorMode = async (on: boolean) => {
    setCreatorModeState(on);
    await AsyncStorage.setItem(KEYS.CREATOR_MODE, on ? "true" : "false");
  };

  const setCreatorPrice = async (price: number) => {
    setCreatorPriceState(price);
    await AsyncStorage.setItem(KEYS.CREATOR_PRICE, String(price));
  };

  const addEarning = (amountEur: number) => {
    setEarnings((prev) => {
      const updated = parseFloat((prev + amountEur).toFixed(2));
      AsyncStorage.setItem(KEYS.EARNINGS, String(updated));
      return updated;
    });
  };

  const clearEarnings = async () => {
    setEarnings(0);
    await AsyncStorage.setItem(KEYS.EARNINGS, "0");
  };

  const addCoins = (amount: number) => {
    setCoinBalance((prev) => {
      const updated = parseFloat((prev + amount).toFixed(2));
      AsyncStorage.setItem(KEYS.COINS, String(updated));
      return updated;
    });
    // Persist to server in background (fire-and-forget)
    getToken().then((token) => {
      const base = getApiUrl();
      fetch(`${base}/api/coins/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ amount }),
      }).then((res) => {
        if (res.ok) return res.json();
      }).then((data) => {
        if (data?.coinBalance != null) {
          setCoinBalance(data.coinBalance);
          AsyncStorage.setItem(KEYS.COINS, String(data.coinBalance));
        }
      }).catch(() => {});
    }).catch(() => {});
  };

  const spendCoins = (amount: number) => {
    setCoinBalance((prev) => {
      const updated = parseFloat(Math.max(0, prev - amount).toFixed(2));
      AsyncStorage.setItem(KEYS.COINS, String(updated));
      return updated;
    });
    // Persist to server in background (fire-and-forget)
    getToken().then((token) => {
      const base = getApiUrl();
      fetch(`${base}/api/coins/spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ amount }),
      }).then((res) => {
        if (res.ok) return res.json();
      }).then((data) => {
        if (data?.coinBalance != null) {
          setCoinBalance(data.coinBalance);
          AsyncStorage.setItem(KEYS.COINS, String(data.coinBalance));
        }
      }).catch(() => {});
    }).catch(() => {});
  };

  const setIsLive = async (on: boolean) => {
    setIsLiveState(on);
    await AsyncStorage.setItem(KEYS.IS_LIVE, on ? "true" : "false");
  };

  const setStripeConnectAccountId = async (id: string) => {
    setStripeConnectAccountIdState(id);
    await AsyncStorage.setItem(KEYS.STRIPE_CONNECT_ACCOUNT_ID, id);
  };

  const addMyPhoto = (uri: string, exclusive: boolean, type: "image" | "video" = "image") => {
    const photo: MyPhoto = { id: Date.now().toString() + Math.random().toString(36).slice(2, 8), uri, exclusive, type };
    setMyPhotos((prev) => {
      const updated = [...prev, photo];
      AsyncStorage.setItem(KEYS.MY_PHOTOS, JSON.stringify(updated));
      return updated;
    });
  };

  const removeMyPhoto = (id: string) => {
    setMyPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      AsyncStorage.setItem(KEYS.MY_PHOTOS, JSON.stringify(updated));
      return updated;
    });
  };

  const togglePhotoExclusive = (id: string) => {
    setMyPhotos((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, exclusive: !p.exclusive } : p));
      AsyncStorage.setItem(KEYS.MY_PHOTOS, JSON.stringify(updated));
      return updated;
    });
  };

  const removeMatch = (profileId: string) => {
    setMatches((prev) => {
      const updated = prev.filter((m) => m.profileId !== profileId);
      AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(updated));
      return updated;
    });
    setDeletedMatchIds((prev) => {
      if (prev.includes(profileId)) return prev;
      const updated = [...prev, profileId];
      AsyncStorage.setItem(KEYS.DELETED_MATCHES, JSON.stringify(updated));
      return updated;
    });
  };

  const clearMessages = (profileId: string) => {
    setMatches((prev) => {
      const updated = prev.map((m) =>
        m.profileId === profileId ? { ...m, messages: [] } : m
      );
      AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(updated));
      return updated;
    });
  };

  const resetLocalState = async () => {
    await AsyncStorage.multiRemove([
      KEYS.MATCHES,
      KEYS.UNLOCKED_PHOTOS,
      KEYS.IS_LIVE,
      KEYS.MY_PHOTOS,
      "discover_filters_v1",
    ]);
    setMatches([]);
    setUnlockedPhotos([]);
    setIsLiveState(false);
    setMyPhotos([]);
  };

  return (
    <AppContext.Provider
      value={{
        isLoaded,
        isSubscribed,
        myPhotos,
        addMyPhoto,
        removeMyPhoto,
        togglePhotoExclusive,
        appMode,
        setAppMode: setAppModeState,
        setSubscribed,
        matches,
        addMatch,
        sendMessage,
        sendMedia,
        sendVoice,
        removeMatch,
        clearMessages,
        resetLocalState,
        unlockedPhotos,
        unlockPhoto,
        creatorMode,
        creatorPrice,
        setCreatorMode,
        setCreatorPrice,
        earnings,
        addEarning,
        clearEarnings,
        coinBalance,
        addCoins,
        spendCoins,
        deletedMatchIds,
        isLive,
        setIsLive,
        stripeConnectAccountId,
        setStripeConnectAccountId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
