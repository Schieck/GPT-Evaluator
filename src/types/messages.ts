export enum ValidatorMessageType {
    // Lifecycle
    VALIDATOR_REGISTER = 'VALIDATOR_REGISTER',
    VALIDATOR_UNREGISTER = 'VALIDATOR_UNREGISTER',

    // Tooltip Management (existing types preserved)
    SHOW_EVALUATION_TOOLTIP = 'SHOW_EVALUATION_TOOLTIP',
    HIDE_EVALUATION_TOOLTIP = 'HIDE_EVALUATION_TOOLTIP',
    UPDATE_EVALUATION_TOOLTIP = 'UPDATE_EVALUATION_TOOLTIP',
    UPDATE_TOOLTIP_POSITION = 'UPDATE_TOOLTIP_POSITION',

    // Validator-specific tooltip messages
    SHOW_VALIDATOR_TOOLTIP = 'SHOW_VALIDATOR_TOOLTIP',
    HIDE_VALIDATOR_TOOLTIP = 'HIDE_VALIDATOR_TOOLTIP',
    UPDATE_VALIDATOR_TOOLTIP = 'UPDATE_VALIDATOR_TOOLTIP',

    // Validation
    VALIDATE_REQUEST = 'VALIDATE_REQUEST',
    VALIDATE_RESPONSE = 'VALIDATE_RESPONSE',

    // Status
    VALIDATOR_STATUS = 'VALIDATOR_STATUS',
    VALIDATOR_ERROR = 'VALIDATOR_ERROR',

    // Existing message types (preserved for compatibility)
    CONTENT_SCRIPT_READY = 'CONTENT_SCRIPT_READY',
    START_SCANNING = 'START_SCANNING',
    STOP_SCANNING = 'STOP_SCANNING',
    NEW_MESSAGE = 'NEW_MESSAGE',
    APPROVE_EVALUATION = 'APPROVE_EVALUATION',
    REJECT_EVALUATION = 'REJECT_EVALUATION',
    EVALUATION_COMPLETE = 'EVALUATION_COMPLETE',
    CONVERSATION_READY = 'CONVERSATION_READY',
    CONVERSATION_APPROVED = 'CONVERSATION_APPROVED',
    OPEN_EVALUATION_DETAILS = 'OPEN_EVALUATION_DETAILS',
    API_CALL = 'API_CALL',
    GET_SCANNING_STATUS = 'GET_SCANNING_STATUS'
}

export interface BaseValidatorMessage {
    type: ValidatorMessageType | string; // Allow string for backward compatibility
    validatorName?: string;
    timestamp: number;
}

export interface ValidatorRegisterMessage extends BaseValidatorMessage {
    type: ValidatorMessageType.VALIDATOR_REGISTER;
    validatorName: string;
    payload: {
        name: string;
        selectors: string[];
        config: ValidatorConfig;
    };
}

export interface ValidateRequestMessage extends BaseValidatorMessage {
    type: ValidatorMessageType.VALIDATE_REQUEST;
    validatorName: string;
    payload: {
        element: string; // selector or identifier
        content: string;
        location?: { x: number; y: number };
    };
}

export interface ValidateResponseMessage extends BaseValidatorMessage {
    type: ValidatorMessageType.VALIDATE_RESPONSE;
    validatorName: string;
    payload: {
        isValid: boolean;
        score?: number;
        message?: string;
        suggestions?: string[];
        data?: any;
    };
}

export interface TooltipMessage extends BaseValidatorMessage {
    type: ValidatorMessageType.SHOW_EVALUATION_TOOLTIP | ValidatorMessageType.UPDATE_EVALUATION_TOOLTIP;
    payload: {
        position: { x: number; y: number };
        status?: 'pending' | 'evaluating' | 'evaluated';
        metrics?: any;
        data?: any;
    };
}

// Validator configuration interface
export interface ValidatorConfig {
    name: string;
    targetSelectors: string[];
    triggerEvents: string[];
    debounceMs?: number;
    autoRegister?: boolean;
}

// Legacy message types (preserved for compatibility)
export interface LegacyMessage {
    type: string;
    data?: any;
    [key: string]: any;
} 