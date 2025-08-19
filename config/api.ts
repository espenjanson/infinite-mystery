// API Configuration
// Store your API keys in environment variables or a secure config service
// Never commit actual API keys to version control

export const API_CONFIG = {
  claude: {
    apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '',
    model: 'claude-sonnet-4-20250514',
  },
  openai: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    imageModel: 'gpt-image-1',
  },
};

export const validateApiKeys = () => {
  const errors = [];
  
  if (!API_CONFIG.claude.apiKey) {
    errors.push('Claude API key is missing. Set EXPO_PUBLIC_CLAUDE_API_KEY in your environment.');
  }
  
  if (!API_CONFIG.openai.apiKey) {
    errors.push('OpenAI API key is missing. Set EXPO_PUBLIC_OPENAI_API_KEY in your environment.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};