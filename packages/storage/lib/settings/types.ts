// Agent name, used to identify the agent in the settings
export enum AgentNameEnum {
  Planner = 'planner',
  Navigator = 'navigator',
}

// Provider type, types before CustomOpenAI are built-in providers, CustomOpenAI is a custom provider
// For built-in providers, we will create ChatModel instances with its respective LangChain ChatModel classes
// For custom providers, we will create ChatModel instances with the ChatOpenAI class
export enum ProviderTypeEnum {
  Gemini = 'gemini',
}

// Default supported models for each built-in provider
export const llmProviderModelNames = {
  [ProviderTypeEnum.Gemini]: ['gemini-nano-1', 'gemini-nano-2'],
};

// Default parameters for each agent per provider
export const llmProviderParameters = {
  [ProviderTypeEnum.Gemini]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.7,
      topP: 0.9,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.3,
      topP: 0.85,
    },
  },
};
