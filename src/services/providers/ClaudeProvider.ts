import { AIProviderType } from '../types';
import type {
  EvaluationInput,
  EvaluationResult,
  EvaluationMetrics,
  EvaluationFeedback
} from '../types';
import { BaseProvider } from './BaseProvider';

const SYSTEM_PROMPT = `
You are an expert AI response evaluator with a specialty in analyzing other AI responses.
Your task is to evaluate the quality of an AI assistant's response to a user prompt.

Analyze the response using these criteria:
1. Relevance: How well the response addresses the user's specific query (0-100)
2. Accuracy: Factual correctness of the information provided (0-100)
3. Completeness: How thoroughly the response addresses all aspects of the prompt (0-100)
4. Coherence: Logical flow, structure, and clarity of the response (0-100)

Additionally, provide a prompt request suggestion that would likely yield a better response. This suggestion should:
- Address any gaps or weaknesses identified in the current response
- Be more specific and detailed than the original prompt
- Include any necessary context or constraints
- Be clear and well-structured
- For prompt suggestions, use prompt engineering techniques to improve the response
- At the suggestions mention what could be the cause of the hallucination
- If it's not relevant, or the prompt or response are slightly misleading, and go against facts and only facts we have, reduce the scores to almost zero, specially if not true or sources aren't present.
- Accuracy should be the heaviest weight for the overall score

Provide numerical scores and detailed analysis of strengths, weaknesses, and specific improvement suggestions.
`;

const EVALUATION_PROMPT = `
<user_prompt>
{userPrompt}
</user_prompt>

<ai_response>
{aiResponse}
</ai_response>

Evaluate the AI response above based on relevance, accuracy, completeness, and coherence.
Provide your evaluation in valid JSON format with this exact structure:
{
  "metrics": {
    "relevance": <0-100>,
    "accuracy": <0-100>,
    "completeness": <0-100>,
    "coherence": <0-100>,
    "overall": <0-100>
  },
  "feedback": {
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "suggestions": ["suggestion1", "suggestion2", ...],
    "summary": "<concise summary of assessment>",
    "promptRequestSuggestion": "<suggested prompt that would likely yield a better response>"
  }
}
Ensure your output is valid JSON that can be parsed programmatically.
`;

export class ClaudeProvider extends BaseProvider {
  id: AIProviderType = AIProviderType.CLAUDE;
  name: string = 'Claude';
  private modelVersion: string = 'claude-3-opus-20240229';

  initialize(apiKey: string, modelVersion?: string): void {
    super.initialize(apiKey);
    if (modelVersion) {
      this.modelVersion = modelVersion;
    }
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    this.validateInput(input);

    const startTime = Date.now();

    try {
      const prompt = EVALUATION_PROMPT
        .replace('{userPrompt}', input.userPrompt)
        .replace('{aiResponse}', input.aiResponse);

      const result = await this.callClaude(prompt);

      return {
        metrics: result.metrics,
        feedback: result.feedback,
        metadata: this.createMetadata(startTime, this.modelVersion)
      };
    } catch (error) {
      console.error('Claude evaluation failed:', error);

      throw new Error(`Claude evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async callClaude(prompt: string): Promise<{
    metrics: EvaluationMetrics;
    feedback: EvaluationFeedback;
  }> {
    try {
      const response = await new Promise<{
        content?: Array<{ text: string }>;
      }>((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'API_CALL',
          url: 'https://api.anthropic.com/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: {
            model: this.modelVersion,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 1000
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Failed to send message to background script: ${chrome.runtime.lastError.message}`));
            return;
          }

          if (!response) {
            reject(new Error('No response received from background script'));
            return;
          }

          if (!response.success) {
            reject(new Error(response.error || 'Unknown error from background script'));
            return;
          }

          if (!response.data) {
            reject(new Error('No data received from API'));
            return;
          }

          resolve(response.data);
        });
      });

      const content = response.content?.[0]?.text;

      if (!content) {
        throw new Error('No content in Claude response');
      }

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Failed to find JSON in Claude response');
        }

        const parsedResponse = JSON.parse(jsonMatch[0]);
        return {
          metrics: parsedResponse.metrics,
          feedback: parsedResponse.feedback
        };
      } catch (parseError) {
        throw new Error(`Failed to parse Claude response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during Claude API call');
    }
  }
} 