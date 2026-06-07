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

interface AppContextType {
  userProfile: UserProfile | null;
  isLoaded: boolean;
  isSubscribed: boolean;
  setUserProfile: (p: UserProfile) => Promise<void>;
  setSubscribed: () => Promise<void>;
  matches: Match[];
  addMatch: (profileId: string) => void;
  sendMessage: (profileId: string, text: string) => void;
  sendMedia: (profileId: string, uri: string, type: "image" | "video") => void;
  sendVoice: (profileId: string, uri: string, duration: number) => void;
  seenProfiles: string[];
  markSeen: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const KEYS = {
  USER_PROFILE: "@spark/profile",
  MATCHES: "@spark/matches",
  SEEN: "@spark/seen",
  SUBSCRIBED: "@spark/subscribed",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [seenProfiles, setSeenProfiles] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubscribed, setIsSubscribedState] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [profileRaw, matchesRaw, seenRaw, subscribedRaw] = await Promise.all([
          AsyncStorage.getItem(KEYS.USER_PROFILE),
          AsyncStorage.getItem(KEYS.MATCHES),
          AsyncStorage.getItem(KEYS.SEEN),
          AsyncStorage.getItem(KEYS.SUBSCRIBED),
        ]);
        if (profileRaw) setUserProfileState(JSON.parse(profileRaw));
        if (matchesRaw) setMatches(JSON.parse(matchesRaw));
        if (seenRaw) setSeenProfiles(JSON.parse(seenRaw));
        if (subscribedRaw === "true") setIsSubscribedState(true);
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

  return (
    <AppContext.Provider
      value={{
        userProfile,
        isLoaded,
        isSubscribed,
        setUserProfile,
        setSubscribed,
        matches,
        addMatch,
        sendMessage,
        sendMedia,
        sendVoice,
        seenProfiles,
        markSeen,
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
