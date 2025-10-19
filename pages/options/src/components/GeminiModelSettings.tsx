import { useEffect, useState } from 'react';
import { Button } from '@extension/ui';
import {
  llmProviderStore,
  agentModelStore,
  AgentNameEnum,
  llmProviderModelNames,
  ProviderTypeEnum,
  type ProviderConfig,
} from '@extension/storage';
import { t } from '@extension/i18n';

interface ModelSettingsProps {
  isDarkMode?: boolean;
}

export const GeminiModelSettings = ({ isDarkMode = false }: ModelSettingsProps) => {
  const [geminiConfig, setGeminiConfig] = useState<ProviderConfig>({
    type: ProviderTypeEnum.Gemini,
    apiKey: '',
    name: 'Gemini',
    modelNames: llmProviderModelNames[ProviderTypeEnum.Gemini],
  });

  const [selectedModels, setSelectedModels] = useState<Record<AgentNameEnum, string>>({
    [AgentNameEnum.Navigator]: llmProviderModelNames[ProviderTypeEnum.Gemini][0],
    [AgentNameEnum.Planner]: llmProviderModelNames[ProviderTypeEnum.Gemini][0],
  });

  const [modelParameters, setModelParameters] = useState<Record<AgentNameEnum, { temperature: number; topP: number }>>({
    [AgentNameEnum.Navigator]: { temperature: 0.1, topP: 0.1 },
    [AgentNameEnum.Planner]: { temperature: 0.2, topP: 0.1 },
  });

  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load initial configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const allProviders = await llmProviderStore.getAllProviders();
        const gemini = allProviders[ProviderTypeEnum.Gemini] || {
          type: ProviderTypeEnum.Gemini,
          apiKey: '',
          name: 'Gemini',
          modelNames: llmProviderModelNames[ProviderTypeEnum.Gemini],
        };
        setGeminiConfig(gemini);

        // Load agent models
        const agentModels = await agentModelStore.getAllAgentModels();
        if (agentModels[AgentNameEnum.Navigator]) {
          setSelectedModels(prev => ({
            ...prev,
            [AgentNameEnum.Navigator]: agentModels[AgentNameEnum.Navigator].modelName,
          }));
          const navParams = (agentModels[AgentNameEnum.Navigator].parameters as {
            temperature: number;
            topP: number;
          }) || {
            temperature: 0.1,
            topP: 0.1,
          };
          setModelParameters(prev => ({
            ...prev,
            [AgentNameEnum.Navigator]: navParams,
          }));
        }
        if (agentModels[AgentNameEnum.Planner]) {
          setSelectedModels(prev => ({
            ...prev,
            [AgentNameEnum.Planner]: agentModels[AgentNameEnum.Planner].modelName,
          }));
          setModelParameters(prev => ({
            ...prev,
            [AgentNameEnum.Planner]: agentModels[AgentNameEnum.Planner].parameters || prev[AgentNameEnum.Planner],
          }));
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    };

    loadConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save Gemini provider config
      await llmProviderStore.setProvider(ProviderTypeEnum.Gemini, geminiConfig);

      // Save agent models
      await agentModelStore.setAgentModel(AgentNameEnum.Navigator, {
        provider: ProviderTypeEnum.Gemini,
        modelName: selectedModels[AgentNameEnum.Navigator],
        parameters: modelParameters[AgentNameEnum.Navigator],
      });

      await agentModelStore.setAgentModel(AgentNameEnum.Planner, {
        provider: ProviderTypeEnum.Gemini,
        modelName: selectedModels[AgentNameEnum.Planner],
        parameters: modelParameters[AgentNameEnum.Planner],
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* API Key Section */}
      <div className="space-y-4">
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {t('options_models_apiKey')}
        </h3>
        <div className="flex items-center space-x-2">
          <input
            type={isApiKeyVisible ? 'text' : 'password'}
            value={geminiConfig.apiKey}
            onChange={e => setGeminiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            className={`flex-1 rounded-md border text-sm ${
              isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white text-gray-700'
            } px-3 py-2`}
            placeholder={t('options_models_apiKey_placeholder')}
          />
          <Button
            onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
            className={`px-3 py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isApiKeyVisible ? '👁️' : '👁️‍🗨️'}
          </Button>
        </div>
      </div>

      {/* Navigator Agent Section */}
      <div className="space-y-4">
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {t('options_models_agents_navigator')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_models_labels_model')}
            </label>
            <select
              value={selectedModels[AgentNameEnum.Navigator]}
              onChange={e => setSelectedModels(prev => ({ ...prev, [AgentNameEnum.Navigator]: e.target.value }))}
              className={`flex-1 rounded-md border text-sm ${
                isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white text-gray-700'
              } px-3 py-2`}>
              {llmProviderModelNames[ProviderTypeEnum.Gemini].map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_models_labels_temperature')}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={modelParameters[AgentNameEnum.Navigator].temperature}
              onChange={e =>
                setModelParameters(prev => ({
                  ...prev,
                  [AgentNameEnum.Navigator]: {
                    ...prev[AgentNameEnum.Navigator],
                    temperature: parseFloat(e.target.value),
                  },
                }))
              }
              className="flex-1"
            />
            <span className={`w-12 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {modelParameters[AgentNameEnum.Navigator].temperature.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <label className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_models_labels_topP')}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={modelParameters[AgentNameEnum.Navigator].topP}
              onChange={e =>
                setModelParameters(prev => ({
                  ...prev,
                  [AgentNameEnum.Navigator]: { ...prev[AgentNameEnum.Navigator], topP: parseFloat(e.target.value) },
                }))
              }
              className="flex-1"
            />
            <span className={`w-12 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {modelParameters[AgentNameEnum.Navigator].topP.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Planner Agent Section */}
      <div className="space-y-4">
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {t('options_models_agents_planner')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_models_labels_model')}
            </label>
            <select
              value={selectedModels[AgentNameEnum.Planner]}
              onChange={e => setSelectedModels(prev => ({ ...prev, [AgentNameEnum.Planner]: e.target.value }))}
              className={`flex-1 rounded-md border text-sm ${
                isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white text-gray-700'
              } px-3 py-2`}>
              {llmProviderModelNames[ProviderTypeEnum.Gemini].map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_models_labels_temperature')}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={modelParameters[AgentNameEnum.Planner].temperature}
              onChange={e =>
                setModelParameters(prev => ({
                  ...prev,
                  [AgentNameEnum.Planner]: { ...prev[AgentNameEnum.Planner], temperature: parseFloat(e.target.value) },
                }))
              }
              className="flex-1"
            />
            <span className={`w-12 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {modelParameters[AgentNameEnum.Planner].temperature.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <label className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_models_labels_topP')}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={modelParameters[AgentNameEnum.Planner].topP}
              onChange={e =>
                setModelParameters(prev => ({
                  ...prev,
                  [AgentNameEnum.Planner]: { ...prev[AgentNameEnum.Planner], topP: parseFloat(e.target.value) },
                }))
              }
              className="flex-1"
            />
            <span className={`w-12 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {modelParameters[AgentNameEnum.Planner].topP.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
          {isSaving ? t('options_models_saving') : t('options_models_save')}
        </Button>
      </div>
    </div>
  );
};
