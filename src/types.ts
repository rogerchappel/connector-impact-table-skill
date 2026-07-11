export type RiskLevel = 'low' | 'medium' | 'high';

export interface ConnectorAction {
  id: string;
  connector: string;
  action: string;
  target: string;
  sideEffect: string;
  approval?: string;
  rollback?: string;
  dryRun?: string;
}

export interface ImpactRow extends ConnectorAction {
  risk: RiskLevel;
  missing: string[];
}

export interface ImpactReport {
  sources: string[];
  generatedAt: string;
  rows: ImpactRow[];
  summary: Record<RiskLevel, number>;
  warnings: string[];
}
