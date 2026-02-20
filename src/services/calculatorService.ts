import api from './api';

export interface CalculatorVariable {
    id: string;
    name: string;
    label: string;
    type: 'NUMBER' | 'SELECT' | 'BOOLEAN';
    unit?: string;
    options?: Array<{ label: string; value: string | number }>;
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

export interface GasometryResult {
    values: {
        ph: number;
        pco2: number;
        hco3: number;
        anionGap: number;
        anionGapCorrected: number;
        deltaRatio: number | null;
    };
    interpretation: {
        primaryDisorder: string;
        disorderType: string;
        severity: string;
        compensationStatus: string;
        expectedCompensation: string;
        anionGapInterpretation: string;
        deltaRatioInterpretation: string | null;
        possibleCauses: string[];
    };
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

    analyzeGasometry: async (inputs: {
        ph: number;
        pco2: number;
        hco3: number;
        na: number;
        cl: number;
        albumin: number;
    }): Promise<GasometryResult> => {
        const response = await api.post('/calculators/gasometry', inputs);
        return response.data;
    },

    getHistory: async () => {
        const response = await api.get('/calculators/history');
        return response.data;
    }
};
