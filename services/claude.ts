import { Anthropic } from "@anthropic-ai/sdk";
import { ConversationEntry, MysteryScript } from "../types/mystery";
import caseHistoryService from "./caseHistory";

class ClaudeService {
  private client: Anthropic | null = null;
  private apiKey: string = "";

  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async generateMysteryScript(
    difficulty: "easy" | "medium" | "hard" = "medium"
  ): Promise<MysteryScript> {
    if (!this.client) {
      throw new Error("Claude API not initialized. Please set your API key.");
    }

    // Get case history to avoid repetition
    const history = await caseHistoryService.getCaseHistory();
    const avoidancePrompt = caseHistoryService.generateAvoidancePrompt(history);

    const prompt = `Create a film noir murder mystery for a detective game. Return ONLY valid JSON with this structure:

{
  "id": "unique_case_id",
  "title": "Case Title",
  "setting": {
    "time": "Specific noir era date and time",
    "location": "Main location",
    "atmosphere": "Dark noir atmosphere description"
  },
  "crime": {
    "victim": {
      "name": "Full name",
      "age": 25,
      "occupation": "Job title",
      "personality": "Brief description",
      "background": "Key background info"
    },
    "timeOfDeath": "Time",
    "causeOfDeath": "How they died",
    "crimeScene": {
      "location": "Where found",
      "description": "Scene description",
      "evidence": [
        {"item": "Evidence name", "description": "What it shows", "significance": "Why important", "isRedHerring": false}
      ]
    }
  },
  "solution": {
    "murderer": "Suspect name",
    "method": "How murder was committed",
    "motive": "Why they did it",
    "opportunity": "When/how they had access",
    "keyEvidence": ["Evidence 1", "Evidence 2"]
  },
  "suspects": [
    {
      "name": "Full name",
      "age": 30,
      "occupation": "Job",
      "relationship": "How they knew victim",
      "personality": "Character traits",
      "alibi": "Where they claim to be",
      "secretOrLie": "What they're hiding",
      "motive": "Potential reason to kill or null",
      "isGuilty": true
    }
  ],
  "witnesses": [
    {"name": "Name", "role": "Who they are", "information": "What they saw", "reliability": "reliable"}
  ],
  "redHerrings": [
    {"description": "False clue", "whyMisleading": "Why it's wrong"}
  ],
  "timeline": [
    {"time": "8:00 PM", "event": "What happened", "isRelevant": true}
  ],
  "locations": [
    {"name": "Location name", "description": "What's here", "availableEvidence": ["Item 1"]}
  ],
  "keyRevelations": [
    {"trigger": "What causes this", "revelation": "What's revealed", "importance": "critical"}
  ]
}

Make it a ${difficulty} difficulty case with 4 suspects, one being the murderer. 

DIFFICULTY REQUIREMENTS:
- EASY: Obvious clues, clear motives, suspects readily admit information
- MEDIUM: Some misleading clues, motives require connecting dots, suspects are somewhat evasive  
- HARD: Multiple red herrings, complex motives requiring deep investigation, suspects actively hide information and lie

The crime scene should have 4-6 pieces of evidence with at least 2 red herrings. Make the true motive complex and not immediately obvious.

${avoidancePrompt}`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        try {
          // Try to extract JSON from the response
          let jsonText = content.text.trim();

          // Look for JSON block if wrapped in markdown
          const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          } else if (jsonText.startsWith("```") && jsonText.endsWith("```")) {
            jsonText = jsonText.slice(3, -3).trim();
          }

          // Find the first { and last } to extract JSON
          const firstBrace = jsonText.indexOf("{");
          const lastBrace = jsonText.lastIndexOf("}");

          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
          }

          const parsed = JSON.parse(jsonText);

          // Add a unique ID if missing
          if (!parsed.id) {
            parsed.id = Date.now().toString();
          }

          return parsed;
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("Raw response:", content.text);
          throw new Error(
            `Failed to parse mystery script: ${
              parseError instanceof Error
                ? parseError.message
                : String(parseError)
            }`
          );
        }
      }

      throw new Error("Unexpected response format");
    } catch (error) {
      console.error("Error generating mystery:", error);
      throw error;
    }
  }

  async runGameMaster(
    script: MysteryScript,
    conversation: ConversationEntry[],
    playerInput: string
  ): Promise<{
    response: string;
    type: "narrator" | "character";
    speaker?: string;
    revealsClue?: string;
    isSolved?: boolean;
    isCorrectSolution?: boolean;
  }> {
    if (!this.client) {
      throw new Error("Claude API not initialized. Please set your API key.");
    }

    const conversationHistory = conversation
      .map(
        (entry) =>
          `${
            entry.type === "player" ? "Player" : entry.speaker || "Narrator"
          }: ${entry.message}`
      )
      .join("\n");

    const prompt = `You are the game master for a film noir murder mystery game. 
You have access to the complete mystery script and must respond to the player's investigation.

MYSTERY SCRIPT:
${JSON.stringify(script, null, 2)}

CONVERSATION HISTORY:
${conversationHistory}

PLAYER'S CURRENT ACTION/QUESTION:
${playerInput}

FIRST PRIORITY - ACCUSATION DETECTION:
Analyze the player's input: If it contains any person's name combined with ANY statement (not question) suggesting that person committed the murder, then the player has made their final accusation. 
This includes any phrasing, whether confident or tentative.
If an accusation is detected, you MUST set isSolved=true regardless of any other consideration.

IMPORTANT RULES:
1. Stay in character as a noir narrator or speaking as characters when interviewed
2. Only reveal information that would logically be discovered through the player's actions
3. NEVER reveal the solution - the player must deduce both murderer AND motive themselves
4. KEEP RESPONSES TO 2 PARAGRAPHS MAXIMUM - be meaningful but concise
5. If the player interviews someone, respond in that character's voice 
6. If the player investigates a location, describe what they find without excessive detail
7. When interviewing suspects: They should be evasive, lie, or deflect questions about their motives
8. Suspects should NEVER directly admit their motives - make players piece it together from evidence
9. Red herrings should seem important initially but don't force connections
10. NOT every question needs to lead somewhere - some investigations are dead ends
11. ACCUSATION RULE: Any statement that names a person as the killer/murderer is the player's ONE accusation
12. Include ALL statements regardless of confidence level - tentative statements count as accusations
13. Only questions about guilt are safe - statements about guilt end the game
14. When you detect an accusation: immediately set isSolved=true (this ends the game)
15. Then determine if they're correct: set isCorrectSolution=true only if they identified the right person
14. Characters should act defensive and suspicious regardless of guilt
13. Focus on what matters - avoid filler words and excessive atmosphere after initial scene setting

CRITICAL - NEUTRAL RESPONSES:
- BE COMPLETELY NEUTRAL - do not guide the player toward any particular path
- When describing a crime scene, list ALL items/evidence with EQUAL weight and emphasis
- Mix important clues with mundane details without highlighting which is which
- Never use leading language like "particularly interesting" or "catches your eye"
- Don't emphasize important evidence over unimportant details
- If asked about something irrelevant, give it the same attention as crucial evidence
- Describe everything matter-of-factly without hints about significance
- Let the player decide what's important - you just report what exists
- Avoid phrases that suggest importance: "notably", "curiously", "stands out", etc.
- Treat red herrings and real clues with identical neutrality
- Use indefinite articles ("a", "some") not definite ones ("the") unless referring to something already established
- NEVER interpret what evidence means - only describe physical appearance
- Don't make connections for the player - they should deduce meanings themselves

INFORMATION RESTRICTIONS:
- NEVER answer direct information queries like "who works here", "who has access", "who is married to whom"
- If asked such questions, respond that you need to investigate to find out
- Information about people, relationships, and access must be discovered through:
  * Examining physical evidence at the crime scene
  * Interviewing specific people you've identified
  * Finding documents, records, or other clues
- Never volunteer lists of suspects, employees, or people with access
- Make the player work for every piece of information through actual investigation

NEUTRALITY EXAMPLES:
- BAD: "You notice a bloodstained letter that seems important"
- GOOD: "There's a letter on the desk, some blood on it, a coffee mug, and yesterday's newspaper"
- BAD: "The suspect nervously mentions they were at home, which seems suspicious"
- GOOD: "They say they were at home watching television"
- BAD: "You should probably check the victim's office"
- GOOD: "The building has several rooms - an office, a storage closet, and a bathroom"
- BAD: "The fingernail appears to belong to someone who does manual work"
- GOOD: "A fingernail, broken, with dirt under it"
- BAD: "The wounds suggest a struggle"
- GOOD: "There are scratches on the arms and bruising on the knuckles"
- BAD: "The killer likely entered through the window"
- GOOD: "A window is open. There's mud on the floor near it"

ACCUSATION DETECTION INSTRUCTION:
Examine the player's input. If it is a statement (not a question) that identifies any person as the killer or murderer, this constitutes their final accusation and the game must end. The confidence level is irrelevant - tentative statements are still accusations. Set isSolved=true for any accusation, then set isCorrectSolution based on whether they correctly identified the killer.

Respond with a JSON object:
{
  "response": "your narrative response (2 paragraphs maximum)",
  "type": "narrator" or "character",
  "speaker": "character name if type is character",
  "isSolved": true if player made an accusation (right or wrong),
  "isCorrectSolution": true if they accused the right person with right motive
}

Remember: Be concise and meaningful. Don't pad responses with unnecessary words.`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        try {
          let jsonText = content.text.trim();

          // Extract JSON from markdown if present
          const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          } else if (jsonText.startsWith("```") && jsonText.endsWith("```")) {
            jsonText = jsonText.slice(3, -3).trim();
          }

          // Find JSON boundaries
          const firstBrace = jsonText.indexOf("{");
          const lastBrace = jsonText.lastIndexOf("}");

          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
          }

          return JSON.parse(jsonText);
        } catch (parseError) {
          console.error("Game master response parse error:", parseError);
          console.error("Raw response:", content.text);

          // Fallback: return a basic response
          return {
            response: content.text,
            type: "narrator",
            isSolved: false,
            isCorrectSolution: false,
          };
        }
      }

      throw new Error("Unexpected response format");
    } catch (error) {
      console.error("Error running game master:", error);
      throw error;
    }
  }

  async generateImagePrompt(caseDescription: string): Promise<string> {
    if (!this.client) {
      throw new Error('Claude API not initialized. Please set your API key.');
    }
    
    const prompt = `Based on this mystery case description, create a safe, artistic image prompt for OpenAI's gpt-image-1 model that captures the noir atmosphere and setting without mentioning violence, death, weapons, or disturbing content.

    Case description: ${caseDescription}
    
    Create a prompt that focuses on:
    - The setting and location (interior/exterior)
    - The time period and atmosphere 
    - Lighting and mood
    - Architectural details
    - Weather conditions
    - Characters present (without mentioning they are suspects or involved in crime)
    - Atmospheric elements like shadows, rain, neon signs
    
    IMPORTANT: Do NOT mention:
    - Death, murder, killing, or violence
    - Weapons or dangerous objects
    - Crime scene details
    - Blood or injuries
    - Investigation or police elements
    
    Instead focus on the atmospheric setting. For example, instead of "crime scene" say "dimly lit room" or "mysterious location".
    
    Return ONLY the safe image prompt, nothing else.`;
    
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
      
      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }
      
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error generating image prompt:', error);
      throw error;
    }
  }

  async analyzeEvidence(
    evidence: string[],
    suspectStatements: string[]
  ): Promise<{
    analysis: string;
    contradictions: string[];
    suggestedQuestions: string[];
  }> {
    if (!this.client) {
      throw new Error("Claude API not initialized. Please set your API key.");
    }

    const prompt = `As a detective, analyze the following evidence and statements:
    Evidence: ${evidence.join("\n")}
    Suspect statements: ${suspectStatements.join("\n")}
    
    Provide:
    1. Brief analysis of the evidence
    2. Any contradictions found
    3. Suggested follow-up questions
    
    Keep the noir detective tone.`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        return JSON.parse(content.text);
      }

      throw new Error("Unexpected response format");
    } catch (error) {
      console.error("Error analyzing evidence:", error);
      throw error;
    }
  }
}

export default new ClaudeService();
