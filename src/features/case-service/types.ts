export type CaseSummary = {
  id: string;
  name: string;
  casePath: string;
  schemaName: string;
  createdAt: string;
  openedAt?: string | null;
};

export type CaseStartupPayload = {
  recentCases: CaseSummary[];
};
