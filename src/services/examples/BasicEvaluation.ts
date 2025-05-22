import { 
  evaluationService, 
  AIProviderType,
  type EvaluationInput
} from '../';

/**
 * Example demonstrating how to use the evaluation service
 */
async function runExample() {
  console.log('GPT Evaluator Service Example');
  console.log('----------------------------');
  
  console.log('Initializing providers...');
  evaluationService.initializeProvider(AIProviderType.OPENAI);
  evaluationService.initializeProvider(AIProviderType.CLAUDE);
  
  // Sample input
  const input: EvaluationInput = {
    userPrompt: 'What is the capital of France and what are some famous landmarks there?',
    aiResponse: `The capital of France is Paris. Paris is home to many world-famous landmarks including:

1. The Eiffel Tower
2. The Louvre Museum, which houses the Mona Lisa
3. Notre-Dame Cathedral
4. Arc de Triomphe
5. Champs-Élysées
6. Sacré-Cœur Basilica in Montmartre
7. Centre Pompidou
8. The Seine River and its beautiful bridges

Paris is known as the "City of Light" and is one of the world's most visited tourist destinations.`
  };
  
  // Example 1: Synchronous evaluation with OpenAI
  console.log('\nExample 1: Synchronous evaluation with OpenAI');
  console.log('-------------------------------------------');
  try {
    console.log('Evaluating with OpenAI...');
    
    const startTime = Date.now();
    const result = await evaluationService.evaluateSync(input, AIProviderType.OPENAI);
    const duration = Date.now() - startTime;
    
    console.log(`Evaluation completed in ${duration}ms`);
    console.log('Metrics:');
    console.log(` - Relevance: ${result.metrics.relevance}/100`);
    console.log(` - Accuracy: ${result.metrics.accuracy}/100`);
    console.log(` - Completeness: ${result.metrics.completeness}/100`);
    console.log(` - Coherence: ${result.metrics.coherence}/100`);
    console.log(` - Overall: ${result.metrics.overall}/100`);
    
    console.log('\nStrengths:');
    result.feedback.strengths.forEach(s => console.log(` - ${s}`));
    
    console.log('\nWeaknesses:');
    result.feedback.weaknesses.forEach(w => console.log(` - ${w}`));
    
    console.log('\nSuggestions:');
    result.feedback.suggestions.forEach(s => console.log(` - ${s}`));
    
    console.log('\nSummary:');
    console.log(result.feedback.summary);
  } catch (error) {
    console.error('Error during synchronous evaluation:', error);
  }
  
  // Example 2: Asynchronous evaluation with Claude
  console.log('\nExample 2: Asynchronous evaluation with Claude');
  console.log('-------------------------------------------');
  try {
    console.log('Starting evaluation with Claude...');
    const response = await evaluationService.evaluate({
      userPrompt: 'What is the capital of France?',
      aiResponse: 'The capital of France is Paris.'
    });
    console.log(`Evaluation ID: ${response.id}`);

    // Poll for results
    let result = evaluationService.getEvaluation(response.id);
    while (result?.status === 'pending' || result?.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      result = evaluationService.getEvaluation(response.id);
    }
    
    if (result) {
      console.log('\nEvaluation result:');
      if (result.status === 'completed' && result.result) {
        console.log('Claude:', result.result.claude);
        console.log('OpenAi:', result.result.openai);
      }
    }
  } catch (error) {
    console.error('Error during asynchronous evaluation:', error);
  }
}

// Uncomment to run the example
// runExample().catch(console.error);

export { runExample }; 