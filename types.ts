
export interface AnalysisResult {
  advice: string;
  training: string;
}

export interface SampleImage {
  id: string;
  label: string;
  url: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
