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
}

export interface Match {
  profileId: string;
  matchedAt: number;
  messages: Message[];
}

interface AppContextType {
  userProfile: UserProfile | null;
  isLoaded: boolean;
  setUserProfile: (p: UserProfile) => Promise<void>;
  matches: Match[];
  addMatch: (profileId: string) => void;
  sendMessage: (profileId: string, text: string) => void;
  seenProfiles: string[];
  markSeen: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const KEYS = {
  USER_PROFILE: "@spark/profile",
  MATCHES: "@spark/matches",
  SEEN: "@spark/seen",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [seenProfiles, setSeenProfiles] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [profileRaw, matchesRaw, seenRaw] = await Promise.all([
          AsyncStorage.getItem(KEYS.USER_PROFILE),
          AsyncStorage.getItem(KEYS.MATCHES),
          AsyncStorage.getItem(KEYS.SEEN),
        ]);
        if (profileRaw) setUserProfileState(JSON.parse(profileRaw));
        if (matchesRaw) setMatches(JSON.parse(matchesRaw));
        if (seenRaw) setSeenProfiles(JSON.parse(seenRaw));
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

  const addMatch = (profileId: string) => {
    setMatches((prev) => {
      if (prev.find((m) => m.profileId === profileId)) return prev;
      const updated = [
        ...prev,
        { profileId, matchedAt: Date.now(), messages: [] },
      ];
      AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(updated));
      return updated;
    });
  };

  const sendMessage = (profileId: string, text: string) => {
    setMatches((prev) => {
      const updated = prev.map((m) => {
        if (m.profileId !== profileId) return m;
        const newMsg: Message = {
          id:
            Date.now().toString() + Math.random().toString(36).substring(2, 9),
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
        setUserProfile,
        matches,
        addMatch,
        sendMessage,
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
