import { TeamMember } from '../types';

export class SprintCalculator {
  /**
   * Calculate the number of working days between two dates (excluding weekends)
   */
  static calculateSprintDays(startDate: Date, endDate: Date): number {
    if (endDate < startDate) {
      return 0;
    }

    let workingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Saturdays and Sundays
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Calculate total team days from all team members
   */
  static calculateTotalTeamDays(teamMembers: TeamMember[]): number {
    return teamMembers.reduce((total, member) => total + member.availableDays, 0);
  }

  /**
   * Calculate team capacity as a percentage
   */
  static calculateTeamCapacity(totalTeamDays: number, teamSize: number, sprintDays: number): number {
    if (teamSize === 0 || sprintDays === 0) {
      return 0;
    }
    return (totalTeamDays / (teamSize * sprintDays)) * 100;
  }

  /**
   * Calculate target story points based on velocity, capacity, and reserved capacity
   */
  static calculateTargetStoryPoints(
    teamVelocity: number,
    teamCapacity: number,
    reservedCapacity: number
  ): number {
    const reservedFraction = reservedCapacity / 100;
    const adjustedCapacity = teamCapacity * (1 - reservedFraction);
    return Math.round((adjustedCapacity / 100) * teamVelocity);
  }

  /**
   * Calculate individual story point capacity for each team member
   */
  static calculateIndividualCapacity(
    teamMembers: TeamMember[],
    targetStoryPoints: number,
    totalTeamDays: number
  ): TeamMember[] {
    if (totalTeamDays === 0) {
      return teamMembers.map(member => ({ ...member, storyPointCapacity: 0 }));
    }

    let totalAssigned = 0;
    const updatedMembers = teamMembers.map(member => {
      const capacity = Math.round((member.availableDays / totalTeamDays) * targetStoryPoints);
      totalAssigned += capacity;
      return { ...member, storyPointCapacity: capacity };
    });

    // Adjust for rounding errors by giving the difference to a random team member
    if (updatedMembers.length > 0 && totalAssigned !== targetStoryPoints) {
      const diff = targetStoryPoints - totalAssigned;
      const randomIndex = Math.floor(Math.random() * updatedMembers.length);
      updatedMembers[randomIndex].storyPointCapacity! += diff;
    }

    return updatedMembers;
  }

  /**
   * Check if a team member has low availability (less than 5 days)
   */
  static hasLowAvailability(member: TeamMember): boolean {
    return member.availableDays < 5;
  }
}