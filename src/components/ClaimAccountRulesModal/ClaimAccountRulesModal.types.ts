export interface ClaimAccountRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    username: string;
}

export type Language = 'en' | 'es';

export interface RuleItem {
    id: number;
    text: {
        en: string;
        es: string;
    };
    checked: boolean;
}

export interface ConsequencesContent {
    title: {
        en: string;
        es: string;
    };
    message: {
        en: string;
        es: string;
    };
    buttonText: {
        en: string;
        es: string;
    };
}

