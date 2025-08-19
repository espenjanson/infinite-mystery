interface GameState {
  currentCase: any | null;
  discoveredClues: string[];
  interrogatedSuspects: string[];
  playerNotes: string[];
  currentLocation: string;
  timeElapsed: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

class GameStateManager {
  private state: GameState = {
    currentCase: null,
    discoveredClues: [],
    interrogatedSuspects: [],
    playerNotes: [],
    currentLocation: 'office',
    timeElapsed: 0,
    difficulty: 'medium',
  };
  
  private listeners: Array<(state: GameState) => void> = [];
  
  getState(): GameState {
    return { ...this.state };
  }
  
  setState(updates: Partial<GameState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }
  
  addClue(clueId: string) {
    if (!this.state.discoveredClues.includes(clueId)) {
      this.setState({
        discoveredClues: [...this.state.discoveredClues, clueId],
      });
    }
  }
  
  addInterrogation(suspectName: string) {
    if (!this.state.interrogatedSuspects.includes(suspectName)) {
      this.setState({
        interrogatedSuspects: [...this.state.interrogatedSuspects, suspectName],
      });
    }
  }
  
  addNote(note: string) {
    this.setState({
      playerNotes: [...this.state.playerNotes, note],
    });
  }
  
  changeLocation(location: string) {
    this.setState({ currentLocation: location });
  }
  
  startNewCase(caseData: any, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.setState({
      currentCase: caseData,
      discoveredClues: [],
      interrogatedSuspects: [],
      playerNotes: [],
      currentLocation: 'crime_scene',
      timeElapsed: 0,
      difficulty,
    });
  }
  
  subscribe(listener: (state: GameState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }
  
  reset() {
    this.state = {
      currentCase: null,
      discoveredClues: [],
      interrogatedSuspects: [],
      playerNotes: [],
      currentLocation: 'office',
      timeElapsed: 0,
      difficulty: 'medium',
    };
    this.notifyListeners();
  }
}

export default new GameStateManager();