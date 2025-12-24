import api from './api';

export interface CalculatorVariable {
    id: string;
    name: string;
    label: string;
    type: 'NUMBER' | 'SELECT' | 'BOOLEAN';
    unit?: string;
    options?: any;
    min?: number;
    max?: number;
    step?: number;
}

export interface CalculatorFormula {
    id: string;
    name: string;
    description?: string;
    category: string;
    variables: CalculatorVariable[];
}

export interface CalculationResult {
    result: number;
}

export const calculatorService = {
    list: async (): Promise<CalculatorFormula[]> => {
        const response = await api.get('/calculators');
        return response.data;
    },

    calculate: async (formulaId: string, inputs: Record<string, number | string>): Promise<CalculationResult> => {
        const response = await api.post('/calculators/calculate', { formulaId, inputs });
        return response.data;
    },

    getHistory: async () => {
        const response = await api.get('/calculators/history');
        return response.data;
    }
};
