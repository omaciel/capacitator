export interface TeamMember {
  name: string;
  availableDays: number;
  ptoDates: string;
  storyPointCapacity?: number;
}

export interface SprintTemplate {
  teamVelocity: number;
  sprintStarts: string;
  sprintEnds: string;
  reservedCapacity: number;
  teamMembers: TeamMember[];
}

export interface SprintCalculations {
  sprintDays: number;
  teamSize: number;
  totalTeamDays: number;
  totalTeamCapacity: number;
  targetStoryPoints: number;
}

export interface AppState {
  sprint: SprintTemplate;
  calculations: SprintCalculations;
}