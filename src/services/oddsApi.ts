import axios from 'axios';
import type { AxiosError } from 'axios';

const API_KEY = import.meta.env.VITE_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';

export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface GameOdds {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Market {
  key: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface ApiError {
  message: string;
  status: number;
}

class OddsApiService {
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000;
  private cacheExpiry = 3600000; // 1 hour cache
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor() {
    // Initialize cache from localStorage
    this.cache = new Map();
    this.loadCacheFromStorage();
  }

  private loadCacheFromStorage() {
    try {
      const storedCache = localStorage.getItem('oddsApiCache');
      if (storedCache) {
        const parsed = JSON.parse(storedCache);
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as { data: any; timestamp: number });
        });
        if (import.meta.env.DEV) {
          console.log('🔵 Loaded cache from localStorage');
        }
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
    }
  }

  private saveToStorage() {
    try {
      const cacheObj = Object.fromEntries(this.cache.entries());
      localStorage.setItem('oddsApiCache', JSON.stringify(cacheObj));
      if (import.meta.env.DEV) {
        console.log('💾 Saved cache to localStorage');
      }
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }

  private async throttledRequest<T>(url: string, params: any = {}): Promise<T> {
    const cacheKey = `${url}${JSON.stringify(params)}`;

    // Clean expired cache entries
    this.cleanExpiredCache();

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      if (import.meta.env.DEV) {
        console.log('🟢 Using cached data for:', url);
        console.log('Cache age:', Math.round((Date.now() - cached.timestamp) / 1000), 'seconds');
      }
      return cached.data as T;
    }

    // Check if there's a pending request for this URL
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      if (import.meta.env.DEV) {
        console.log('🟡 Reusing pending request for:', url);
      }
      return pendingRequest;
    }

    if (import.meta.env.DEV) {
      console.log('🔴 Making new API request to:', url);
    }

    // Implement throttling
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }

    // Create the request promise
    const requestPromise = (async () => {
      try {
        const response = await axios.get<T>(url, {
          params: {
            apiKey: API_KEY,
            ...params
          }
        });

        // Update cache
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
        this.saveToStorage(); // Save to localStorage after updating cache

        // Log remaining requests only in development
        if (import.meta.env.DEV) {
          console.log('API Request made to:', url);
          console.log('Remaining requests:', response.headers['x-requests-remaining']);
          console.log('Used requests:', response.headers['x-requests-used']);
        }

        this.lastRequestTime = Date.now();
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          console.error('API Error:', {
            status: axiosError.response.status,
            data: axiosError.response.data
          });
        }
        throw error;
      } finally {
        // Clean up pending request
        this.pendingRequests.delete(cacheKey);
      }
    })();

    // Store the pending request
    this.pendingRequests.set(cacheKey, requestPromise);

    return requestPromise;
  }

  private cleanExpiredCache() {
    const now = Date.now();
    let hasExpired = false;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
        hasExpired = true;
      }
    }

    if (hasExpired) {
      this.saveToStorage();
      if (import.meta.env.DEV) {
        console.log('🧹 Cleaned expired cache entries');
      }
    }
  }

  async getOdds(
    sportKey: string = 'basketball_nba',
    markets: string = 'h2h',
    regions: string = 'us'
  ): Promise<GameOdds[]> {
    return this.throttledRequest<GameOdds[]>(`${BASE_URL}/sports/${sportKey}/odds`, {
      regions,
      markets,
      oddsFormat: 'decimal',
      dateFormat: 'iso'
    });
  }

  async getSports(): Promise<Sport[]> {
    return this.throttledRequest<Sport[]>(`${BASE_URL}/sports`);
  }

  // Method to clear cache if needed
  clearCache() {
    this.cache.clear();
    localStorage.removeItem('oddsApiCache');
    console.log('🗑️ Cache cleared from memory and storage');
  }
}

export const oddsApi = new OddsApiService(); 