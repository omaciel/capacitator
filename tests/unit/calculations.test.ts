import { SprintCalculator } from '../../src/utils/calculations';
import { TeamMember } from '../../src/types';

describe('SprintCalculator', () => {
  describe('calculateSprintDays', () => {
    it('should calculate working days correctly excluding weekends', () => {
      // Test a typical 2-week sprint
      const startDate = new Date('2025-09-27T00:00:00'); // Saturday
      const endDate = new Date('2025-10-15T00:00:00');   // Wednesday

      const result = SprintCalculator.calculateSprintDays(startDate, endDate);

      // Expected: 13 working days (excluding weekends)
      expect(result).toBe(13);
    });

    it('should return 0 when end date is before start date', () => {
      const startDate = new Date('2025-10-15T00:00:00');
      const endDate = new Date('2025-09-27T00:00:00');

      const result = SprintCalculator.calculateSprintDays(startDate, endDate);

      expect(result).toBe(0);
    });

    it('should return 0 when start and end dates are the same', () => {
      const startDate = new Date('2025-09-27T00:00:00');
      const endDate = new Date('2025-09-27T00:00:00');

      const result = SprintCalculator.calculateSprintDays(startDate, endDate);

      expect(result).toBe(0);
    });

    it('should handle single day spans correctly', () => {
      // Friday to Saturday (1 working day)
      const startDate = new Date('2025-10-03T00:00:00'); // Friday
      const endDate = new Date('2025-10-04T00:00:00');   // Saturday

      const result = SprintCalculator.calculateSprintDays(startDate, endDate);

      expect(result).toBe(1);
    });

    it('should handle weekend-only spans', () => {
      // Saturday to Sunday (0 working days)
      const startDate = new Date('2025-10-04T00:00:00'); // Saturday
      const endDate = new Date('2025-10-05T00:00:00');   // Sunday

      const result = SprintCalculator.calculateSprintDays(startDate, endDate);

      expect(result).toBe(0);
    });

    it('should handle Monday to Friday correctly', () => {
      // Monday to Friday (5 working days)
      const startDate = new Date('2025-09-29T00:00:00'); // Monday
      const endDate = new Date('2025-10-03T00:00:00');   // Friday

      const result = SprintCalculator.calculateSprintDays(startDate, endDate);

      expect(result).toBe(5);
    });
  });

  describe('calculateTotalTeamDays', () => {
    it('should sum available days from all team members', () => {
      const teamMembers: TeamMember[] = [
        { name: 'Alice', availableDays: 10, ptoDates: '', storyPointCapacity: 0 },
        { name: 'Bob', availableDays: 8, ptoDates: '', storyPointCapacity: 0 },
        { name: 'Charlie', availableDays: 12, ptoDates: '', storyPointCapacity: 0 }
      ];

      const result = SprintCalculator.calculateTotalTeamDays(teamMembers);

      expect(result).toBe(30);
    });

    it('should return 0 for empty team', () => {
      const teamMembers: TeamMember[] = [];

      const result = SprintCalculator.calculateTotalTeamDays(teamMembers);

      expect(result).toBe(0);
    });

    it('should handle decimal days correctly', () => {
      const teamMembers: TeamMember[] = [
        { name: 'Alice', availableDays: 10.5, ptoDates: '', storyPointCapacity: 0 },
        { name: 'Bob', availableDays: 7.5, ptoDates: '', storyPointCapacity: 0 }
      ];

      const result = SprintCalculator.calculateTotalTeamDays(teamMembers);

      expect(result).toBe(18);
    });
  });

  describe('calculateTeamCapacity', () => {
    it('should calculate team capacity percentage correctly', () => {
      const totalTeamDays = 20;
      const teamSize = 2;
      const sprintDays = 10;

      const result = SprintCalculator.calculateTeamCapacity(totalTeamDays, teamSize, sprintDays);

      // (20 / (2 * 10)) * 100 = 100%
      expect(result).toBe(100);
    });

    it('should return 0 when team size is 0', () => {
      const totalTeamDays = 20;
      const teamSize = 0;
      const sprintDays = 10;

      const result = SprintCalculator.calculateTeamCapacity(totalTeamDays, teamSize, sprintDays);

      expect(result).toBe(0);
    });

    it('should return 0 when sprint days is 0', () => {
      const totalTeamDays = 20;
      const teamSize = 2;
      const sprintDays = 0;

      const result = SprintCalculator.calculateTeamCapacity(totalTeamDays, teamSize, sprintDays);

      expect(result).toBe(0);
    });

    it('should handle partial capacity correctly', () => {
      const totalTeamDays = 15;
      const teamSize = 2;
      const sprintDays = 10;

      const result = SprintCalculator.calculateTeamCapacity(totalTeamDays, teamSize, sprintDays);

      // (15 / (2 * 10)) * 100 = 75%
      expect(result).toBe(75);
    });
  });

  describe('calculateTargetStoryPoints', () => {
    it('should calculate target story points with reserved capacity', () => {
      const teamVelocity = 100;
      const teamCapacity = 80; // 80%
      const reservedCapacity = 10; // 10%

      const result = SprintCalculator.calculateTargetStoryPoints(teamVelocity, teamCapacity, reservedCapacity);

      // 80% * (1 - 0.1) * 100 = 72 story points
      expect(result).toBe(72);
    });

    it('should handle 100% capacity with no reserved capacity', () => {
      const teamVelocity = 88;
      const teamCapacity = 100;
      const reservedCapacity = 0;

      const result = SprintCalculator.calculateTargetStoryPoints(teamVelocity, teamCapacity, reservedCapacity);

      expect(result).toBe(88);
    });

    it('should handle high reserved capacity', () => {
      const teamVelocity = 100;
      const teamCapacity = 100;
      const reservedCapacity = 50; // 50%

      const result = SprintCalculator.calculateTargetStoryPoints(teamVelocity, teamCapacity, reservedCapacity);

      // 100% * (1 - 0.5) * 100 = 50 story points
      expect(result).toBe(50);
    });

    it('should round results correctly', () => {
      const teamVelocity = 77;
      const teamCapacity = 85.7;
      const reservedCapacity = 12.5;

      const result = SprintCalculator.calculateTargetStoryPoints(teamVelocity, teamCapacity, reservedCapacity);

      // Should round to nearest integer
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('calculateIndividualCapacity', () => {
    it('should distribute story points proportionally based on available days', () => {
      const teamMembers: TeamMember[] = [
        { name: 'Alice', availableDays: 10, ptoDates: '', storyPointCapacity: 0 },
        { name: 'Bob', availableDays: 5, ptoDates: '', storyPointCapacity: 0 }
      ];
      const targetStoryPoints = 30;
      const totalTeamDays = 15;

      const result = SprintCalculator.calculateIndividualCapacity(teamMembers, targetStoryPoints, totalTeamDays);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');

      // Alice should get 2/3 of points (20), Bob should get 1/3 (10)
      const aliceCapacity = result[0].storyPointCapacity || 0;
      const bobCapacity = result[1].storyPointCapacity || 0;

      expect(aliceCapacity + bobCapacity).toBe(30);
      expect(aliceCapacity).toBeGreaterThan(bobCapacity);
    });

    it('should handle rounding differences by adjusting one member', () => {
      const teamMembers: TeamMember[] = [
        { name: 'Alice', availableDays: 10, ptoDates: '', storyPointCapacity: 0 },
        { name: 'Bob', availableDays: 10, ptoDates: '', storyPointCapacity: 0 },
        { name: 'Charlie', availableDays: 10, ptoDates: '', storyPointCapacity: 0 }
      ];
      const targetStoryPoints = 100;
      const totalTeamDays = 30;

      const result = SprintCalculator.calculateIndividualCapacity(teamMembers, targetStoryPoints, totalTeamDays);

      const totalAssigned = result.reduce((sum, member) => sum + (member.storyPointCapacity || 0), 0);
      expect(totalAssigned).toBe(100);
    });

    it('should return zero capacity when total team days is 0', () => {
      const teamMembers: TeamMember[] = [
        { name: 'Alice', availableDays: 0, ptoDates: '', storyPointCapacity: 0 }
      ];
      const targetStoryPoints = 50;
      const totalTeamDays = 0;

      const result = SprintCalculator.calculateIndividualCapacity(teamMembers, targetStoryPoints, totalTeamDays);

      expect(result).toHaveLength(1);
      expect(result[0].storyPointCapacity).toBe(0);
    });

    it('should handle empty team members array', () => {
      const teamMembers: TeamMember[] = [];
      const targetStoryPoints = 50;
      const totalTeamDays = 0;

      const result = SprintCalculator.calculateIndividualCapacity(teamMembers, targetStoryPoints, totalTeamDays);

      expect(result).toHaveLength(0);
    });
  });

  describe('hasLowAvailability', () => {
    it('should return true for members with less than 5 days', () => {
      const member: TeamMember = {
        name: 'Alice',
        availableDays: 4,
        ptoDates: '',
        storyPointCapacity: 0
      };

      const result = SprintCalculator.hasLowAvailability(member);

      expect(result).toBe(true);
    });

    it('should return false for members with 5 or more days', () => {
      const member: TeamMember = {
        name: 'Bob',
        availableDays: 5,
        ptoDates: '',
        storyPointCapacity: 0
      };

      const result = SprintCalculator.hasLowAvailability(member);

      expect(result).toBe(false);
    });

    it('should return false for members with more than 5 days', () => {
      const member: TeamMember = {
        name: 'Charlie',
        availableDays: 10,
        ptoDates: '',
        storyPointCapacity: 0
      };

      const result = SprintCalculator.hasLowAvailability(member);

      expect(result).toBe(false);
    });

    it('should handle decimal days correctly', () => {
      const member: TeamMember = {
        name: 'Diana',
        availableDays: 4.5,
        ptoDates: '',
        storyPointCapacity: 0
      };

      const result = SprintCalculator.hasLowAvailability(member);

      expect(result).toBe(true);
    });
  });
});