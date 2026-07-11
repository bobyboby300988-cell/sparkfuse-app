import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { useGetCurrentAuthUser, useActivateSubscription } from "@workspace/api-client-react";
import { useAuth } from "@clerk/expo";
import { checkPendingWebTokenCheckout } from "@/config/payments";

export interface MyPhoto {
  id: string;
  uri: string;
  exclusive: boolean;
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
}

export type AppMode = "dating" | "naughty" | "business" | "party" | "travel" | "social";

interface AppContextType {
  isLoaded: boolean;
  isSubscribed: boolean;
  myPhotos: MyPhoto[];
  addMyPhoto: (uri: string, exclusive: boolean) => void;
  removeMyPhoto: (id: string) => void;
  togglePhotoExclusive: (id: string) => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  setSubscribed: () => Promise<void>;
  matches: Match[];
  addMatch: (profileId: string) => void;
  sendMessage: (profileId: string, text: string) => void;
  sendMedia: (profileId: string, uri: string, type: "image" | "video") => void;
  sendVoice: (profileId: string, uri: string, duration: number) => void;
  removeMatch: (profileId: string) => void;
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
  COINS: "@spark/coins",
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

  const { isSignedIn } = useAuth();
  const { data: authUserData } = useGetCurrentAuthUser({
    query: { enabled: !!isSignedIn, queryKey: ["currentAuthUser"] },
  });
  const activateSubscriptionMutation = useActivateSubscription();

  // Server is the source of truth for subscription status once the user is
  // signed in — this makes a paid subscription follow the account across
  // devices/reinstalls instead of being stuck in local AsyncStorage.
  useEffect(() => {
    if (authUserData?.user?.isSubscribed) {
      setIsSubscribedState(true);
      AsyncStorage.setItem(KEYS.SUBSCRIBED, "true");
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

  // On web, Stripe Checkout redirects back with a real page reload (no
  // custom URL scheme like on native), so any pending token purchase has
  // to be recovered from the URL after the app remounts.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    checkPendingWebTokenCheckout()
      .then((result) => {
        if (!result) return;
        setCoinBalance((prev) => {
          const updated = parseFloat((prev + result.tokens).toFixed(2));
          AsyncStorage.setItem(KEYS.COINS, String(updated));
          return updated;
        });
        Alert.alert("Spark Tokens added! 🔥", `${result.tokens} ST added to your wallet!`);
      })
      .catch(() => {
        // ignore — nothing to recover or verification failed
      });
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

  const addMatch = (profileId: string) => {
    setMatches((prev) => {
      if (prev.find((m) => m.profileId === profileId)) return prev;
      const updated = [...prev, { profileId, matchedAt: Date.now(), messages: [] }];
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
  };

  const spendCoins = (amount: number) => {
    setCoinBalance((prev) => {
      const updated = parseFloat(Math.max(0, prev - amount).toFixed(2));
      AsyncStorage.setItem(KEYS.COINS, String(updated));
      return updated;
    });
  };

  const setIsLive = async (on: boolean) => {
    setIsLiveState(on);
    await AsyncStorage.setItem(KEYS.IS_LIVE, on ? "true" : "false");
  };

  const setStripeConnectAccountId = async (id: string) => {
    setStripeConnectAccountIdState(id);
    await AsyncStorage.setItem(KEYS.STRIPE_CONNECT_ACCOUNT_ID, id);
  };

  const addMyPhoto = (uri: string, exclusive: boolean) => {
    const photo: MyPhoto = { id: Date.now().toString() + Math.random().toString(36).slice(2, 8), uri, exclusive };
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
