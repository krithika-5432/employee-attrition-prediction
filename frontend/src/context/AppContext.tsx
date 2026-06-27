import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PredictionResult {
  prediction: number;
  probability: number;
  risk_category: string;
  risk_status: string;
  risk_score: number;
  model_used: string;
  top_factors: any[];
  recommendations: any[];
  business_metrics: any;
}

interface AppState {
  datasetUploaded: boolean;
  predictionDone: boolean;
  datasetInfo: any | null;
  predictionResult: PredictionResult | null;
  predictionInput: any | null;
  batchResults: any | null;
  selectedModel: string;
  setDatasetUploaded: (v: boolean) => void;
  setPredictionDone: (v: boolean) => void;
  setDatasetInfo: (v: any) => void;
  setPredictionResult: (v: PredictionResult | null) => void;
  setPredictionInput: (v: any) => void;
  setBatchResults: (v: any) => void;
  setSelectedModel: (v: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [datasetUploaded, setDatasetUploaded] = useState(false);
  const [predictionDone, setPredictionDone] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [predictionInput, setPredictionInput] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState('xgboost');

  return (
    <AppContext.Provider value={{
      datasetUploaded, predictionDone, datasetInfo, predictionResult,
      predictionInput, batchResults, selectedModel,
      setDatasetUploaded, setPredictionDone, setDatasetInfo,
      setPredictionResult, setPredictionInput, setBatchResults, setSelectedModel
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
