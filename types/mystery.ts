export interface MysteryScript {
  id: string;
  title: string;
  setting: {
    time: string;
    location: string;
    atmosphere: string;
  };
  
  // The crime details
  crime: {
    victim: {
      name: string;
      age: number;
      occupation: string;
      personality: string;
      background: string;
    };
    timeOfDeath: string;
    causeOfDeath: string;
    crimeScene: {
      location: string;
      description: string;
      evidence: Array<{
        item: string;
        description: string;
        significance: string;
        isRedHerring: boolean;
      }>;
    };
  };
  
  // The actual solution
  solution: {
    murderer: string;
    method: string;
    motive: string;
    opportunity: string;
    keyEvidence: string[];
  };
  
  // Cast of characters
  suspects: Array<{
    name: string;
    age: number;
    occupation: string;
    relationship: string;
    personality: string;
    alibi: string;
    secretOrLie: string;
    motive: string | null;
    isGuilty: boolean;
  }>;
  
  // Other characters (witnesses, staff, etc.)
  witnesses: Array<{
    name: string;
    role: string;
    information: string;
    reliability: 'reliable' | 'unreliable' | 'partially reliable';
  }>;
  
  // Red herrings and false leads
  redHerrings: Array<{
    description: string;
    whyMisleading: string;
  }>;
  
  // Timeline of events
  timeline: Array<{
    time: string;
    event: string;
    isRelevant: boolean;
  }>;
  
  // Locations that can be investigated
  locations: Array<{
    name: string;
    description: string;
    availableEvidence: string[];
  }>;
  
  // Special dialogue or revelations
  keyRevelations: Array<{
    trigger: string;
    revelation: string;
    importance: 'critical' | 'important' | 'minor';
  }>;
}

export interface GameSession {
  id: string;
  caseId: string;
  script: MysteryScript;
  caseImageUrl?: string;
  startedAt: Date;
  completedAt?: Date;
  conversation: ConversationEntry[];
  discoveredClues: string[];
  interviewedCharacters: string[];
  visitedLocations: string[];
  playerNotes: string[];
  isSolved: boolean;
  attempts: number;
}

export interface ConversationEntry {
  id: string;
  type: 'player' | 'narrator' | 'character';
  speaker?: string;
  message: string;
  timestamp: Date;
  revealsClue?: string;
}