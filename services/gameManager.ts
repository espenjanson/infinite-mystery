import { generateUUID } from '../utils/uuid';
import { MysteryScript, GameSession, ConversationEntry } from '../types/mystery';
import claudeService from './claude';
import storageService from './storage';
import caseHistoryService from './caseHistory';
import openaiService from './openai';
import { API_CONFIG } from '../config/api';
import mysteriesData from '../assets/mysteries.json';

interface GameRules {
  maxHints: number;
  hintsUsed: number;
  questionsAsked: number;
  startTime: Date;
  endTime?: Date;
}

class GameManager {
  private currentSession: GameSession | null = null;
  private gameRules: GameRules = {
    maxHints: 2,
    hintsUsed: 0,
    questionsAsked: 0,
    startTime: new Date(),
  };
  
  // Convert pre-generated mystery to MysteryScript format
  private convertPreGeneratedMystery(mystery: any): MysteryScript {
    return {
      id: mystery.id.toString(),
      title: mystery.title,
      setting: {
        time: mystery.timeOfDeath || "Late evening",
        location: mystery.location,
        atmosphere: mystery.introduction // Use the full introduction as atmosphere
      },
      crime: {
        victim: {
          name: mystery.victim.name,
          age: mystery.victim.age,
          occupation: mystery.victim.occupation,
          personality: mystery.victim.background,
          background: mystery.victim.background
        },
        timeOfDeath: mystery.timeOfDeath,
        causeOfDeath: mystery.causeOfDeath,
        crimeScene: {
          location: mystery.location,
          description: "The scene of the crime awaits your investigation.",
          evidence: mystery.evidence.map((item: string, index: number) => ({
            item: item,
            description: item,
            significance: "Important evidence",
            isRedHerring: Math.random() > 0.7 // Some evidence is red herrings
          }))
        }
      },
      solution: {
        murderer: mystery.killer,
        method: mystery.murderWeapon,
        motive: mystery.motive,
        opportunity: mystery.solution,
        keyEvidence: mystery.evidence.slice(0, 3)
      },
      suspects: mystery.suspects.map((suspect: any) => ({
        name: suspect.name,
        age: 35,
        occupation: suspect.occupation,
        relationship: "Connected to victim",
        personality: suspect.motive,
        alibi: suspect.alibi,
        secretOrLie: suspect.motive,
        motive: suspect.motive,
        isGuilty: suspect.name === mystery.killer
      })),
      witnesses: [],
      redHerrings: [
        { description: "Misleading evidence", whyMisleading: "Designed to confuse" }
      ],
      timeline: [
        { time: mystery.timeOfDeath, event: "Crime occurred", isRelevant: true }
      ],
      locations: [
        { name: mystery.location, description: mystery.description, availableEvidence: mystery.evidence.slice(0, 3) }
      ],
      keyRevelations: [
        { trigger: "Investigation", revelation: "Key discovery", importance: "critical" }
      ]
    };
  }

  // Start a new game
  async startNewGame(
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    onCaseGenerated?: () => void,
    onImageGenerated?: () => void
  ): Promise<GameSession> {
    try {
      // Use pre-generated mystery for faster gameplay
      const randomMystery = mysteriesData.mysteries[Math.floor(Math.random() * mysteriesData.mysteries.length)];
      const script = this.convertPreGeneratedMystery(randomMystery);
      
      // Notify that case is generated
      if (onCaseGenerated) {
        onCaseGenerated();
      }
      
      // Create new session
      const session: GameSession = {
        id: generateUUID(),
        caseId: script.id,
        script,
        startedAt: new Date(),
        conversation: [],
        discoveredClues: [],
        interviewedCharacters: [],
        visitedLocations: [],
        playerNotes: [],
        isSolved: false,
        attempts: 0,
      };
      
      // Add opening narration
      const openingMessage: ConversationEntry = {
        id: generateUUID(),
        type: 'narrator',
        message: this.generateOpeningNarration(script),
        timestamp: new Date(),
      };
      
      session.conversation.push(openingMessage);
      
      // Don't add suggestions here - they'll be added after intro completes
      
      // Generate case illustration if OpenAI key is available
      // TODO: Temporarily commented out for faster development - re-enable later
      /*
      try {
        if (API_CONFIG.openai.apiKey) {
          // First, ask Claude to generate a safe image prompt
          const safeImagePrompt = await claudeService.generateImagePrompt(openingMessage.message);
          
          // Then use that prompt with OpenAI
          openaiService.initialize(API_CONFIG.openai.apiKey);
          const caseImageUrl = await openaiService.generateCaseIllustration(safeImagePrompt);
          session.caseImageUrl = caseImageUrl;
          
          // Notify that image is generated
          if (onImageGenerated) {
            onImageGenerated();
          }
        }
      } catch (error) {
        console.warn('Failed to generate case illustration:', error);
        // Continue without image if generation fails
        if (onImageGenerated) {
          onImageGenerated();
        }
      }
      */
      
      // Skip image generation for now
      if (onImageGenerated) {
        onImageGenerated();
      }
      
      // Save to storage and add to history
      await storageService.saveMysteryScript(script);
      await storageService.saveGameSession(session);
      await caseHistoryService.addCaseToHistory(script);
      
      this.currentSession = session;
      this.resetGameRules();
      
      return session;
    } catch (error) {
      console.error('Error starting new game:', error);
      throw error;
    }
  }
  
  // Process player input
  async processPlayerInput(input: string): Promise<{
    response: ConversationEntry;
    isGameOver: boolean;
    isSolved: boolean;
    score?: number;
  }> {
    if (!this.currentSession) {
      throw new Error('No active game session');
    }
    
    this.gameRules.questionsAsked++;
    
    // Add player message to conversation
    const playerMessage: ConversationEntry = {
      id: generateUUID(),
      type: 'player',
      message: input,
      timestamp: new Date(),
    };
    
    this.currentSession.conversation.push(playerMessage);
    
    // Get response from Claude game master
    const gmResponse = await claudeService.runGameMaster(
      this.currentSession.script,
      this.currentSession.conversation,
      input
    );
    
    // Check if game is solved or failed BEFORE adding response
    let isGameOver = false;
    let score = undefined;
    
    if (gmResponse.isSolved) {
      this.currentSession.completedAt = new Date();
      isGameOver = true;
      
      if (gmResponse.isCorrectSolution) {
        // Correct guess - they win!
        this.currentSession.isSolved = true;
        score = this.calculateScore();
        
        // Replace Claude's response with victory message
        const victoryMessage: ConversationEntry = {
          id: generateUUID(),
          type: 'narrator',
          message: this.generateVictoryMessage(score),
          timestamp: new Date(),
        };
        
        this.currentSession.conversation.push(victoryMessage);
      } else {
        // Wrong guess - game over with 0 points
        this.currentSession.isSolved = false;
        score = 0;
        
        // Replace Claude's response with failure message
        const failureMessage: ConversationEntry = {
          id: generateUUID(),
          type: 'narrator',
          message: this.generateFailureMessage(),
          timestamp: new Date(),
        };
        
        this.currentSession.conversation.push(failureMessage);
      }
    } else {
      // Only add Claude's response if game is NOT over
      const responseEntry: ConversationEntry = {
        id: generateUUID(),
        type: gmResponse.type,
        speaker: gmResponse.speaker,
        message: gmResponse.response,
        timestamp: new Date(),
      };
      
      this.currentSession.conversation.push(responseEntry);
    }
    
    // Save session
    await storageService.saveGameSession(this.currentSession);
    
    // Return the last message added (either Claude's response or game over message)
    const lastMessage = this.currentSession.conversation[this.currentSession.conversation.length - 1];
    
    return {
      response: lastMessage,
      isGameOver,
      isSolved: this.currentSession.isSolved,
      score,
    };
  }
  
  // Request a hint
  async requestHint(): Promise<ConversationEntry | null> {
    if (!this.currentSession) {
      throw new Error('No active game session');
    }
    
    if (this.gameRules.hintsUsed >= this.gameRules.maxHints) {
      return null;
    }
    
    this.gameRules.hintsUsed++;
    
    const hintMessage: ConversationEntry = {
      id: generateUUID(),
      type: 'narrator',
      message: this.generateHint(),
      timestamp: new Date(),
    };
    
    this.currentSession.conversation.push(hintMessage);
    await storageService.saveGameSession(this.currentSession);
    
    return hintMessage;
  }
  
  // Give up and reveal solution
  async giveUp(): Promise<ConversationEntry> {
    if (!this.currentSession) {
      throw new Error('No active game session');
    }
    
    const solution = this.currentSession.script.solution;
    
    const revealMessage: ConversationEntry = {
      id: generateUUID(),
      type: 'narrator',
      message: `You've decided to close the case. Here's what really happened:\n\n` +
               `The murderer was ${solution.murderer}.\n\n` +
               `${solution.murderer} killed the victim using ${solution.method}.\n\n` +
               `The motive: ${solution.motive}\n\n` +
               `The key evidence that would have solved the case: ${solution.keyEvidence.join(', ')}\n\n` +
               `Sometimes the truth stays buried in the shadows of this city. Better luck next time, detective.`,
      timestamp: new Date(),
    };
    
    this.currentSession.conversation.push(revealMessage);
    this.currentSession.completedAt = new Date();
    await storageService.saveGameSession(this.currentSession);
    
    return revealMessage;
  }
  
  // Calculate score based on questions asked and hints used
  private calculateScore(): number {
    const baseScore = 1000;
    const questionPenalty = Math.min(this.gameRules.questionsAsked * 10, 500);
    const hintPenalty = this.gameRules.hintsUsed * 100;
    const timePenalty = this.calculateTimePenalty();
    
    return Math.max(baseScore - questionPenalty - hintPenalty - timePenalty, 100);
  }
  
  private calculateTimePenalty(): number {
    const minutes = (new Date().getTime() - this.gameRules.startTime.getTime()) / 60000;
    return Math.min(Math.floor(minutes) * 5, 200);
  }
  
  private generateOpeningNarration(script: MysteryScript): string {
    // Use the full introduction from the mystery, which already includes atmosphere and case details
    return `${script.setting.atmosphere}\n\nThe case is yours, detective. Where do you begin?`;
  }
  
  private generateGameplaySuggestions(): string {
    return `💡 **Suggestions to get started:**\n\n` +
           `• **Examine the crime scene** - Look for evidence and clues\n` +
           `• **Talk to the coroner** - Learn about the cause of death and time of death\n` +
           `• **Check the victim's belongings** - Search for personal items that might reveal connections\n\n` +
           `You can also interview witnesses, search specific areas, or follow your own investigative instincts.`;
  }
  
  private generateHint(): string {
    if (!this.currentSession) return '';
    
    const hints = [
      `Consider the timeline carefully. Not everyone was where they claimed to be.`,
      `One of the suspects has a secret they're desperately trying to hide.`,
      `The evidence at the crime scene tells a different story than what you've been told.`,
      `Focus on the motive. Who had the most to gain from the victim's death?`,
      `Sometimes the most obvious suspect is just a red herring.`,
    ];
    
    const hintNumber = this.gameRules.hintsUsed;
    const remainingHints = this.gameRules.maxHints - this.gameRules.hintsUsed;
    
    return `HINT ${hintNumber}/${this.gameRules.maxHints}: ${hints[Math.floor(Math.random() * hints.length)]}\n` +
           `${remainingHints > 0 ? `You have ${remainingHints} hint(s) remaining.` : 'No more hints available.'}`;
  }
  
  private generateVictoryMessage(score: number): string {
    let rating = '';
    if (score >= 900) rating = 'Master Detective';
    else if (score >= 700) rating = 'Senior Investigator';
    else if (score >= 500) rating = 'Detective';
    else if (score >= 300) rating = 'Junior Detective';
    else rating = 'Rookie';
    
    return `🎉 CASE SOLVED! 🎉\n\n` +
           `Excellent work, detective! You've cracked the case.\n\n` +
           `Your Score: ${score} points\n` +
           `Rating: ${rating}\n` +
           `Questions Asked: ${this.gameRules.questionsAsked}\n` +
           `Hints Used: ${this.gameRules.hintsUsed}/${this.gameRules.maxHints}\n\n` +
           `The city's a little safer tonight thanks to your keen eye for justice.`;
  }
  
  private generateFailureMessage(): string {
    if (!this.currentSession) return '';
    
    const solution = this.currentSession.script.solution;
    
    return `❌ WRONG ACCUSATION - CASE FAILED ❌\n\n` +
           `You've accused the wrong person. In this business, you only get one shot at justice.\n\n` +
           `Your Score: 0 points\n` +
           `Questions Asked: ${this.gameRules.questionsAsked}\n` +
           `Hints Used: ${this.gameRules.hintsUsed}/${this.gameRules.maxHints}\n\n` +
           `The real killer was ${solution.murderer}.\n` +
           `${solution.murderer} killed the victim using ${solution.method}.\n` +
           `The motive: ${solution.motive}\n\n` +
           `Sometimes the truth stays hidden in the shadows. Better luck next time, detective.`;
  }
  
  private resetGameRules() {
    this.gameRules = {
      maxHints: 2,
      hintsUsed: 0,
      questionsAsked: 0,
      startTime: new Date(),
    };
  }
  
  // Resume existing session
  async resumeSession(sessionId: string): Promise<GameSession | null> {
    const session = await storageService.getGameSession(sessionId);
    if (session && !session.isSolved) {
      this.currentSession = session;
      return session;
    }
    return null;
  }
  
  // Get current session
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }
  
  // Get game stats
  getGameStats() {
    return {
      hintsUsed: this.gameRules.hintsUsed,
      hintsRemaining: this.gameRules.maxHints - this.gameRules.hintsUsed,
      questionsAsked: this.gameRules.questionsAsked,
    };
  }
}

export default new GameManager();