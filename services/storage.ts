import AsyncStorage from '@react-native-async-storage/async-storage';
import { MysteryScript, GameSession } from '../types/mystery';

const STORAGE_KEYS = {
  CURRENT_SESSION: '@infinite_mystery/current_session',
  SESSIONS_LIST: '@infinite_mystery/sessions',
  SCRIPTS_PREFIX: '@infinite_mystery/scripts/',
  SESSIONS_PREFIX: '@infinite_mystery/sessions/',
};

class StorageService {
  // Save mystery script
  async saveMysteryScript(script: MysteryScript): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.SCRIPTS_PREFIX}${script.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(script));
    } catch (error) {
      console.error('Error saving mystery script:', error);
      throw error;
    }
  }
  
  // Get mystery script
  async getMysteryScript(scriptId: string): Promise<MysteryScript | null> {
    try {
      const key = `${STORAGE_KEYS.SCRIPTS_PREFIX}${scriptId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting mystery script:', error);
      return null;
    }
  }
  
  // Save game session
  async saveGameSession(session: GameSession): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.SESSIONS_PREFIX}${session.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(session));
      
      // Update sessions list
      const sessionsList = await this.getSessionsList();
      if (!sessionsList.includes(session.id)) {
        sessionsList.push(session.id);
        await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS_LIST, JSON.stringify(sessionsList));
      }
      
      // Set as current session
      await this.setCurrentSession(session.id);
    } catch (error) {
      console.error('Error saving game session:', error);
      throw error;
    }
  }
  
  // Get game session
  async getGameSession(sessionId: string): Promise<GameSession | null> {
    try {
      const key = `${STORAGE_KEYS.SESSIONS_PREFIX}${sessionId}`;
      const data = await AsyncStorage.getItem(key);
      if (!data) return null;
      
      const session = JSON.parse(data);
      // Convert date strings back to Date objects
      session.startedAt = new Date(session.startedAt);
      if (session.completedAt) {
        session.completedAt = new Date(session.completedAt);
      }
      session.conversation = session.conversation.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
      
      return session;
    } catch (error) {
      console.error('Error getting game session:', error);
      return null;
    }
  }
  
  // Get current session ID
  async getCurrentSessionId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }
  
  // Set current session
  async setCurrentSession(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
    } catch (error) {
      console.error('Error setting current session:', error);
      throw error;
    }
  }
  
  // Get all sessions list
  async getSessionsList(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS_LIST);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting sessions list:', error);
      return [];
    }
  }
  
  // Get all sessions with details
  async getAllSessions(): Promise<GameSession[]> {
    try {
      const sessionIds = await this.getSessionsList();
      const sessions: GameSession[] = [];
      
      for (const id of sessionIds) {
        const session = await this.getGameSession(id);
        if (session) {
          sessions.push(session);
        }
      }
      
      // Sort by start date, newest first
      return sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }
  
  // Delete session
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // Remove session data
      const sessionKey = `${STORAGE_KEYS.SESSIONS_PREFIX}${sessionId}`;
      await AsyncStorage.removeItem(sessionKey);
      
      // Update sessions list
      const sessionsList = await this.getSessionsList();
      const updatedList = sessionsList.filter(id => id !== sessionId);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS_LIST, JSON.stringify(updatedList));
      
      // Clear current session if it was deleted
      const currentId = await this.getCurrentSessionId();
      if (currentId === sessionId) {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }
  
  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('@infinite_mystery/'));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

export default new StorageService();