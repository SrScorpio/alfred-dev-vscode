export interface ProjectStatus {
  flow: string;
  phase: string;
  pendingGate: string;
  nextAction: string;
  issues: IssueStatus[];
  lastUpdated?: string;
}

export interface IssueStatus {
  number: number;
  title: string;
  label: 'story' | 'backlog' | 'in-progress' | 'in-review' | 'blocked' | 'closed';
}

export interface AgentInfo {
  name: string;
  alias: string;
  role: string;
  file: string;
}
