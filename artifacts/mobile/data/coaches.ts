export interface SessionType {
  id: string;
  label: string;
  duration: number;
  price: number;
  tokenPrice: number;
}

export interface Coach {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo: ReturnType<typeof require>;
  rating: number;
  reviewCount: number;
  location: string;
  specialties: string[];
  sessions: SessionType[];
  availability: string[];
  yearsExperience: number;
  totalClients: number;
}

// Demo coaches removed until real coaches are onboarded.
export const MOCK_COACHES: Coach[] = [];
