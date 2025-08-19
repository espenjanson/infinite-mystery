import AsyncStorage from '@react-native-async-storage/async-storage';
import { MysteryScript } from '../types/mystery';

const CASE_HISTORY_KEY = '@infinite_mystery/case_history';

interface CaseHistory {
  id: string;
  summary: string;
  createdAt: Date;
}

class CaseHistoryService {
  async getCaseHistory(): Promise<CaseHistory[]> {
    try {
      const data = await AsyncStorage.getItem(CASE_HISTORY_KEY);
      if (!data) return [];
      
      const history = JSON.parse(data);
      return history.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }));
    } catch (error) {
      console.error('Error getting case history:', error);
      return [];
    }
  }
  
  async addCaseToHistory(script: MysteryScript): Promise<void> {
    try {
      const history = await this.getCaseHistory();
      
      // Create narrative summary of the case
      const summary = this.createCaseSummary(script);
      
      const newEntry: CaseHistory = {
        id: script.id,
        summary,
        createdAt: new Date(),
      };
      
      history.push(newEntry);
      
      // Keep only last 10 cases to prevent storage bloat
      const recentHistory = history.slice(-10);
      
      await AsyncStorage.setItem(CASE_HISTORY_KEY, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Error adding case to history:', error);
    }
  }
  
  private createCaseSummary(script: MysteryScript): string {
    const suspects = script.suspects.map(s => s.name).join(', ');
    
    return `In "${script.title}", ${script.crime.victim.name} (${script.crime.victim.occupation}) was found dead at ${script.setting.location} from ${script.crime.causeOfDeath}. ` +
           `The investigation took place in ${script.setting.time} with suspects including ${suspects}. ` +
           `${script.solution.murderer} was the killer, motivated by ${script.solution.motive}. ` +
           `The case featured ${script.crime.crimeScene.evidence.length} pieces of evidence and ${script.redHerrings.length} red herrings.`;
  }
  
  generateAvoidancePrompt(history: CaseHistory[]): string {
    if (history.length === 0) {
      return 'Create a fresh, original noir mystery.';
    }
    
    const recentSummaries = history
      .slice(-5) // Last 5 cases
      .map(c => c.summary)
      .join('\n\n');
    
    return `PREVIOUS CASES - You must create something COMPLETELY DIFFERENT from these recent mysteries:

${recentSummaries}

REQUIREMENTS FOR VARIETY:
- Use a DIFFERENT type of location (avoid repeating clubs, offices, hotels, etc.)
- Use a DIFFERENT murder method (vary between shooting, stabbing, poisoning, strangulation, etc.)
- Use DIFFERENT character archetypes and professions
- Use DIFFERENT ethnic backgrounds and names (vary between Irish, Italian, Jewish, Chinese, Mexican, etc.)
- Use DIFFERENT motives (avoid repeating blackmail, affair, money, etc.)
- Create UNIQUE atmosphere and story themes
- Vary the time of day, weather, and season

Be creative and ensure this case feels fresh and distinct from all previous ones!`;
  }
  
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CASE_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing case history:', error);
    }
  }
}

export default new CaseHistoryService();