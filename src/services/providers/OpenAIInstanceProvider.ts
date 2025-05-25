import { AIProviderType } from '../types';
import type {
    EvaluationInput,
    EvaluationResult,
    EvaluationMetrics,
    EvaluationFeedback,
    ProviderInstance
} from '../types';
import { BaseInstanceProvider } from './BaseInstanceProvider';

// Reuse the same evaluation prompts
const SYSTEM_PROMPT = `
You are an AI response evaluator. Your task is to evaluate the quality of an AI's response to a user prompt.
Analyze the response based on the following criteria:
1. Relevance: How well does the response address the user's prompt?
2. Accuracy: Is the information provided factually correct?
3. Completeness: Does the response cover all necessary aspects of the prompt?
4. Coherence: Is the response well-structured and easy to understand?

Additionally, provide a prompt request suggestion that would likely yield a better response. This suggestion should:
- Address any gaps or weaknesses identified in the current response
- Be more specific and detailed than the original prompt
- Include any necessary context or constraints
- Be clear and well-structured
- For prompt suggestions, use prompt engineering techniques to improve the response
- At the suggestions mention what could be the cause of the hallucination
- If it's not relevant, or the prompt or response are slightly misleading, and go against facts and only facts we have, reduce the scores to almost zero, specially if not true or sources aren't present.
- Accuracy should be the heaviest weight for the overall score
- For each evaluation, provide specific references that support your scoring decisions. These should include:
  - Fact-checking sources for accuracy claims
  - Methodological explanations for how you assessed each criterion
  - Contradictions or supporting evidence found
  - Links to authoritative sources when applicable (use real URLs when possible)
  - Documentation of any misinformation or factual errors

Provide your evaluation in the following JSON format:
{
  "metrics": {
    "relevance": <score 0-100>,
    "accuracy": <score 0-100>,
    "completeness": <score 0-100>,
    "coherence": <score 0-100>,
    "overall": <average score 0-100>
  },
  "feedback": {
    "strengths": ["list of strengths"],
    "weaknesses": ["list of weaknesses"],
    "suggestions": ["list of suggestions for improvement"],
    "summary": "overall assessment",
    "promptRequestSuggestion": "suggested prompt that would likely yield a better response",
    "references": [
      {
        "title": "Reference title",
        "url": "https://example.com" (if available, only working links),
        "description": "How this reference supports the evaluation",
        "category": "fact-check|source|contradiction|supporting-evidence|methodology",
        "relevanceToScore": "relevance|accuracy|completeness|coherence"
      },
      ...
    ]
  }
}`;

const EVALUATION_PROMPT = `Please evaluate the following AI response to a user prompt:

User Prompt:
{userPrompt}

AI Response:
{aiResponse}

Provide your evaluation in the specified JSON format.`;

/**
 * Instance-based OpenAI provider
 * Follows Single Responsibility: Only handles OpenAI-specific evaluation
 */
export class OpenAIInstanceProvider extends BaseInstanceProvider {
    // For backward compatibility with enum-based system
    id = AIProviderType.OPENAI;

    constructor(instance: ProviderInstance) {
        super(instance);
    }

    getProviderType(): string {
        return 'openai';
    }

    async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
        try {
            this.validateInput(input);

            const startTime = Date.now();

            const prompt = EVALUATION_PROMPT
                .replace('{userPrompt}', input.userPrompt)
                .replace('{aiResponse}', input.aiResponse);

            const result = await this.callOpenAI(prompt);

            return {
                metrics: result.metrics,
                feedback: result.feedback,
                metadata: this.createMetadata(startTime)
            };
        } catch (error) {
            this.errorHandler.handleError(error, `${this.name}.evaluate`);
            throw error;
        }
    }

    private async callOpenAI(prompt: string): Promise<{
        metrics: EvaluationMetrics;
        feedback: EvaluationFeedback;
    }> {
        try {
            const endpoint = this.getEndpoint() || 'https://api.openai.com/v1/chat/completions';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    ...this.getCustomHeaders()
                },
                body: JSON.stringify({
                    model: this.getModel(),
                    messages: [
                        {
                            role: 'system',
                            content: SYSTEM_PROMPT
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: this.getTemperature(),
                    max_tokens: this.getMaxTokens()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content;

            if (!content) {
                throw new Error('No content in OpenAI response');
            }

            try {
                const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
                const parsedResponse = JSON.parse(jsonContent);
                return {
                    metrics: parsedResponse.metrics,
                    feedback: parsedResponse.feedback
                };
            } catch (parseError) {
                throw new Error(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
            }
        } catch (error) {
            this.errorHandler.handleError(error, `${this.name}.callOpenAI`);
            throw error;
        }
    }
} 