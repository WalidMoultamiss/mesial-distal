export interface Attachment {
  name: string;
  tooth: string;
  beginTime: number;
  endTime: number;
  attachGuid: string;
}

export interface IprEntry {
  tooth: string;
  step: number;
  mesialIpr: number;
  distalIpr: number;
}

export interface PositionersList {
  upper: number[];
  lower: number[];
}

export interface DentalSetup {
  id: string;
  setupName: string;
  upperEndIn: number;
  lowerEndIn: number;
  upperStartFrom: number;
  lowerStartFrom: number;
  version: string | null;
  maxAligners: number;
  manAligners: number;
  attachCount: number;
  bracketCount: number;
  maxIpr: number;
  manIpr: number;
  attachList: Attachment[];
  precisionCutList: any[]; // Assuming generic array as example was empty
  iprList: IprEntry[];
  extractList: any[];
  positionersList: PositionersList;
}

// Helper types for visualization
export interface ToothData {
  id: number;
  hasAttachment: boolean;
  totalIpr: number;
  attachments: Attachment[];
  iprEntries: IprEntry[];
}
