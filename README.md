# GPT-Evaluator

A Chrome extension that helps evaluate and analyze AI responses in real-time. This tool provides insights into the quality and accuracy of AI-generated content, making it easier to assess and improve AI interactions.

## Features

- **Live Scanner**: Monitor and analyze GPT conversations in real-time with automatic evaluation
- **Legacy Evaluator**: Manual evaluation of AI responses against user inputs with detailed analysis
- **History Tracking**: Comprehensive history of past evaluations with approval/rejection functionality
- **Multi-Provider Support**: Works with both OpenAI and Claude AI providers
- **Modern UI**: Beautiful and intuitive interface with smooth animations and collapsible sections
- **Configurable**: Easy setup with API key management and provider settings
- **Error Handling**: Robust error handling and reporting system
- **Responsive Design**: Works both as a popup and in a separate window mode

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
   > If you need to run it locally with hot reload, run `npm run dev` and select the dist as same as the build.

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from the build output

## Usage

1. **Live Scanner**:
   - Click the "Live" tab to start monitoring ChatGPT conversations
   - View real-time evaluation metrics and scores
   - Track conversation quality over time

2. **Legacy Evaluator**:
   - Enter your prompt in the "User Input" field
   - Paste the AI response in the "AI Response" field
   - Get instant evaluation results
   - Collapsible input fields for better space management

3. **History**:
   - View all past evaluations
   - Approve or reject evaluations
   - Track conversation timestamps and results

4. **Configuration**:
   - Add your API keys for OpenAI and/or Claude
   - Customize evaluation settings
   - Manage your preferences

## Development

This project is built with:
- React
- TypeScript
- Framer Motion for animations
- Tailwind CSS for styling
- Chrome Extension APIs

### Project Structure

```
src/
├── components/         # React components
├── services/          # Business logic and API services
│   ├── providers/     # AI provider implementations
│   └── types.ts       # Type definitions
├── utils/             # Utility functions
└── popup/             # Extension popup UI
```

### Adding New AI Providers

The GPT-Evaluator uses an extensible architecture that makes adding new AI providers straightforward. The system follows the Open/Closed principle, allowing new providers to be added without modifying existing code.

#### Architecture Overview

The provider system consists of several key components:

1. **Provider Templates** (`src/services/providers/ProviderTemplates.ts`) - Configuration templates for each provider type
2. **Base Classes** - Abstract base classes that define the provider interface
3. **Provider Factory** (`src/services/providers/ProviderInstanceFactory.ts`) - Creates and manages provider instances
4. **Type Definitions** (`src/services/types.ts`) - TypeScript interfaces and types

#### Step-by-Step Guide

**1. Add Provider Template**

First, add your provider configuration to `src/services/providers/ProviderTemplates.ts`:

```typescript
export const PROVIDER_TEMPLATES: Record<string, ProviderTemplate> = {
  // ... existing providers
  
  'your-provider': {
    type: 'your-provider',
    displayName: 'Your Provider Name',
    models: [
      { id: 'model-1', name: 'Model 1' },
      { id: 'model-2', name: 'Model 2', isDefault: true }
    ],
    defaultConfig: {
      temperature: 0.3,
      maxTokens: 1000
    },
    defaultEndpoint: 'https://api.yourprovider.com/v1/chat/completions',
    validateConfig: (config) => {
      const errors: string[] = [];
      if (!config.apiKey) {
        errors.push('API key is required');
      }
      // Add custom validation logic
      return { isValid: errors.length === 0, errors };
    }
  }
};
```

**2. Create Provider Implementation**

Create a new provider class in `src/services/providers/YourProviderInstanceProvider.ts`:

```typescript
import { BaseInstanceProvider } from './BaseInstanceProvider';
import type { EvaluationInput, EvaluationResult, EvaluationMetrics, EvaluationFeedback } from '../types';

export class YourProviderInstanceProvider extends BaseInstanceProvider {
  constructor(instanceId: string, instanceConfig: any) {
    super(instanceId, instanceConfig);
    this.id = 'your-provider' as any;
    this.name = `Your Provider (${instanceConfig.model})`;
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    try {
      this.validateInput(input);
      const startTime = Date.now();

      // Implement your API call logic here
      const result = await this.callYourProviderAPI(input);

      return {
        metrics: result.metrics,
        feedback: result.feedback,
        metadata: this.createMetadata(startTime, this.instanceConfig.model)
      };
    } catch (error) {
      this.errorHandler.handleError(error, `${this.name}.evaluate`);
      throw error;
    }
  }

  private async callYourProviderAPI(input: EvaluationInput): Promise<{
    metrics: EvaluationMetrics;
    feedback: EvaluationFeedback;
  }> {
    // Implement your specific API call logic
    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.instanceConfig.apiKey}`,
        ...this.getCustomHeaders()
      },
      body: JSON.stringify({
        model: this.getModel(),
        messages: [
          { role: 'system', content: 'Your system prompt' },
          { role: 'user', content: `Evaluate this: ${input.userPrompt} -> ${input.aiResponse}` }
        ],
        temperature: this.getTemperature(),
        max_tokens: this.getMaxTokens()
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    // Parse and return your provider's response format
    return this.parseResponse(data);
  }

  private parseResponse(data: any): { metrics: EvaluationMetrics; feedback: EvaluationFeedback } {
    // Implement response parsing logic specific to your provider
    // Return standardized metrics and feedback
  }
}
```

**3. Register Provider in Factory**

Add your provider to `src/services/providers/ProviderInstanceFactory.ts`:

```typescript
import { YourProviderInstanceProvider } from './YourProviderInstanceProvider';

export class ProviderInstanceFactory {
  createProvider(instance: ProviderInstance): InstanceAIProvider {
    switch (instance.type) {
      case 'openai':
        return new OpenAIInstanceProvider(instance.id, instance.config);
      case 'claude':
        return new ClaudeInstanceProvider(instance.id, instance.config);
      case 'your-provider':
        return new YourProviderInstanceProvider(instance.id, instance.config);
      default:
        throw new Error(`Unknown provider type: ${instance.type}`);
    }
  }
}
```

**4. Export Your Provider**

Add the export to `src/services/providers/index.ts`:

```typescript
export { YourProviderInstanceProvider } from './YourProviderInstanceProvider';
```

**5. Update Manifest (if needed)**

If your provider requires additional host permissions, add them to `manifest.json`:

```json
{
  "host_permissions": [
    "https://api.openai.com/*",
    "https://api.anthropic.com/*",
    "https://api.yourprovider.com/*"
  ]
}
```

#### Key Interfaces to Implement

Your provider must implement these key interfaces:

- **`EvaluationInput`** - Input format (userPrompt, aiResponse, parameters)
- **`EvaluationResult`** - Output format (metrics, feedback, metadata)
- **`EvaluationMetrics`** - Scoring metrics (relevance, accuracy, completeness, coherence, overall)
- **`EvaluationFeedback`** - Detailed feedback (strengths, weaknesses, suggestions, summary)

#### Testing Your Provider

1. Build the extension: `npm run build`
2. Load it in Chrome and configure your new provider
3. Test with the Legacy Evaluator tab
4. Verify metrics and feedback are properly formatted

#### Best Practices

- **Error Handling**: Use the built-in `ErrorHandlingService` for consistent error management
- **Validation**: Implement proper input validation using the `validateInput()` method
- **Configuration**: Support all standard configuration options (temperature, maxTokens, etc.)
- **Response Parsing**: Ensure your provider returns standardized metrics (0-100 scale)
- **Documentation**: Add JSDoc comments for better code documentation

The architecture is designed to be provider-agnostic, so focus on implementing the evaluation logic specific to your AI provider while following the established patterns.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.