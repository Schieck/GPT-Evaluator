export * from './types';

export * from './providers';

import { EvaluationService } from './EvaluationService';

export const evaluationService = EvaluationService.getInstance();

export { EvaluationService }; 