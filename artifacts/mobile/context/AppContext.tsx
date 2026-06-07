import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserProfile {
  name: string;
  age: number;
  bio: string;
  seeking: "men" | "women" | "everyone";
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
  userProfile: UserProfile | null;
  isLoaded: boolean;
  isSubscribed: boolean;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  setUserProfile: (p: UserProfile) => Promise<void>;
  setSubscribed: () => Promise<void>;
  matches: Match[];
  addMatch: (profileId: string) => void;
  sendMessage: (profileId: string, text: string) => void;
  sendMedia: (profileId: string, uri: string, type: "image" | "video") => void;
  sendVoice: (profileId: string, uri: string, duration: number) => void;
  seenProfiles: string[];
  markSeen: (id: string) => void;
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
}

const AppContext = createContext<AppContextType | null>(null);

const KEYS = {
  USER_PROFILE: "@spark/profile",
  MATCHES: "@spark/matches",
  SEEN: "@spark/seen",
  SUBSCRIBED: "@spark/subscribed",
  UNLOCKED_PHOTOS: "@spark/unlocked_photos",
  CREATOR_MODE: "@spark/creator_mode",
  CREATOR_PRICE: "@spark/creator_price",
  EARNINGS: "@spark/earnings",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [seenProfiles, setSeenProfiles] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubscribed, setIsSubscribedState] = useState(false);
  const [appMode, setAppModeState] = useState<AppMode>("dating");
  const [unlockedPhotos, setUnlockedPhotos] = useState<string[]>([]);
  const [creatorMode, setCreatorModeState] = useState(false);
  const [creatorPrice, setCreatorPriceState] = useState(3);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [profileRaw, matchesRaw, seenRaw, subscribedRaw, unlockedRaw, creatorModeRaw, creatorPriceRaw, earningsRaw] = await Promise.all([
          AsyncStorage.getItem(KEYS.USER_PROFILE),
          AsyncStorage.getItem(KEYS.MATCHES),
          AsyncStorage.getItem(KEYS.SEEN),
          AsyncStorage.getItem(KEYS.SUBSCRIBED),
          AsyncStorage.getItem(KEYS.UNLOCKED_PHOTOS),
          AsyncStorage.getItem(KEYS.CREATOR_MODE),
          AsyncStorage.getItem(KEYS.CREATOR_PRICE),
          AsyncStorage.getItem(KEYS.EARNINGS),
        ]);
        if (profileRaw) setUserProfileState(JSON.parse(profileRaw));
        if (matchesRaw) setMatches(JSON.parse(matchesRaw));
        if (seenRaw) setSeenProfiles(JSON.parse(seenRaw));
        if (subscribedRaw === "true") setIsSubscribedState(true);
        if (unlockedRaw) setUnlockedPhotos(JSON.parse(unlockedRaw));
        if (creatorModeRaw === "true") setCreatorModeState(true);
        if (creatorPriceRaw) setCreatorPriceState(Number(creatorPriceRaw));
        if (earningsRaw) setEarnings(parseFloat(earningsRaw));
      } catch {
        // ignore storage errors
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  const setUserProfile = async (p: UserProfile) => {
    setUserProfileState(p);
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(p));
  };

  const setSubscribed = async () => {
    setIsSubscribedState(true);
    await AsyncStorage.setItem(KEYS.SUBSCRIBED, "true");
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

  const markSeen = (id: string) => {
    setSeenProfiles((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      AsyncStorage.setItem(KEYS.SEEN, JSON.stringify(updated));
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
        userProfile,
        isLoaded,
        isSubscribed,
        appMode,
        setAppMode: setAppModeState,
        setUserProfile,
        setSubscribed,
        matches,
        addMatch,
        sendMessage,
        sendMedia,
        sendVoice,
        seenProfiles,
        markSeen,
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
