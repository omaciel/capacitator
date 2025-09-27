/**
 * @jest-environment jsdom
 */

import { SprintCalculator } from '../../src/utils/calculations';
import { TeamMember, SprintTemplate } from '../../src/types';

// Mock DOM elements and methods needed by the renderer
const mockElements: { [key: string]: HTMLElement } = {};

const createElement = (tagName: string, id?: string): HTMLElement => {
  const element = document.createElement(tagName);
  if (id) {
    element.id = id;
    mockElements[id] = element;
  }
  return element;
};

// Mock CapacitatorRenderer for testing (simplified version focusing on logic)
class MockCapacitatorRenderer {
  public state = {
    sprint: {
      teamVelocity: 88,
      sprintStarts: '',
      sprintEnds: '',
      reservedCapacity: 10,
      teamMembers: [] as TeamMember[]
    },
    calculations: {
      sprintDays: 0,
      teamSize: 0,
      totalTeamDays: 0,
      totalTeamCapacity: 0,
      targetStoryPoints: 0
    }
  };

  getElementById(id: string): HTMLElement {
    if (!mockElements[id]) {
      mockElements[id] = createElement('div', id);
    }
    return mockElements[id];
  }

  calculateSprintDays(): void {
    const startDate = new Date(this.state.sprint.sprintStarts + 'T00:00:00');
    const endDate = new Date(this.state.sprint.sprintEnds + 'T00:00:00');
    this.state.calculations.sprintDays = SprintCalculator.calculateSprintDays(startDate, endDate);
  }

  calculateTeamDetails(): void {
    this.state.calculations.teamSize = this.state.sprint.teamMembers.length;
    this.state.calculations.totalTeamDays = SprintCalculator.calculateTotalTeamDays(this.state.sprint.teamMembers);
    this.state.calculations.totalTeamCapacity = SprintCalculator.calculateTeamCapacity(
      this.state.calculations.totalTeamDays,
      this.state.calculations.teamSize,
      this.state.calculations.sprintDays
    );
    this.state.calculations.targetStoryPoints = SprintCalculator.calculateTargetStoryPoints(
      this.state.sprint.teamVelocity,
      this.state.calculations.totalTeamCapacity,
      this.state.sprint.reservedCapacity
    );
  }

  updateAllCalculations(): void {
    this.calculateSprintDays();
    this.calculateTeamDetails();
    this.updateTeamMemberCapacities();
  }

  updateTeamMemberCapacities(): void {
    this.state.sprint.teamMembers = SprintCalculator.calculateIndividualCapacity(
      this.state.sprint.teamMembers,
      this.state.calculations.targetStoryPoints,
      this.state.calculations.totalTeamDays
    );
  }

  addTeamMember(): void {
    const newMember: TeamMember = {
      name: '',
      availableDays: this.state.calculations.sprintDays,
      ptoDates: '',
      storyPointCapacity: 0
    };
    this.state.sprint.teamMembers.push(newMember);
    this.updateAllCalculations();
  }

  removeTeamMember(index: number): void {
    this.state.sprint.teamMembers.splice(index, 1);
    this.updateAllCalculations();
  }

  updateTeamMember(index: number, field: keyof TeamMember, value: any): void {
    if (index >= 0 && index < this.state.sprint.teamMembers.length) {
      (this.state.sprint.teamMembers[index] as any)[field] = value;
      this.updateAllCalculations();
    }
  }

  loadTemplateData(template: SprintTemplate): void {
    this.state.sprint = { ...template };
    this.updateAllCalculations();
  }
}

describe('CapacitatorRenderer', () => {
  let renderer: MockCapacitatorRenderer;

  beforeEach(() => {
    renderer = new MockCapacitatorRenderer();
    // Clear mock elements
    Object.keys(mockElements).forEach(key => delete mockElements[key]);
  });

  describe('State Management', () => {
    it('should initialize with default state', () => {
      expect(renderer.state.sprint.teamVelocity).toBe(88);
      expect(renderer.state.sprint.reservedCapacity).toBe(10);
      expect(renderer.state.sprint.teamMembers).toHaveLength(0);
      expect(renderer.state.calculations.sprintDays).toBe(0);
    });

    it('should update state when sprint dates change', () => {
      renderer.state.sprint.sprintStarts = '2025-09-27';
      renderer.state.sprint.sprintEnds = '2025-10-15';

      renderer.calculateSprintDays();

      expect(renderer.state.calculations.sprintDays).toBe(13);
    });
  });

  describe('Team Member Management', () => {
    it('should add team members correctly', () => {
      renderer.state.sprint.sprintStarts = '2025-09-27';
      renderer.state.sprint.sprintEnds = '2025-10-15';
      renderer.calculateSprintDays();

      renderer.addTeamMember();

      expect(renderer.state.sprint.teamMembers).toHaveLength(1);
      expect(renderer.state.sprint.teamMembers[0].availableDays).toBe(13);
      expect(renderer.state.calculations.teamSize).toBe(1);
    });

    it('should remove team members correctly', () => {
      renderer.addTeamMember();
      renderer.addTeamMember();

      expect(renderer.state.sprint.teamMembers).toHaveLength(2);

      renderer.removeTeamMember(0);

      expect(renderer.state.sprint.teamMembers).toHaveLength(1);
      expect(renderer.state.calculations.teamSize).toBe(1);
    });

    it('should update team member properties correctly', () => {
      renderer.addTeamMember();

      renderer.updateTeamMember(0, 'name', 'Alice');
      renderer.updateTeamMember(0, 'availableDays', 8);

      expect(renderer.state.sprint.teamMembers[0].name).toBe('Alice');
      expect(renderer.state.sprint.teamMembers[0].availableDays).toBe(8);
    });

    it('should handle invalid team member index gracefully', () => {
      const initialLength = renderer.state.sprint.teamMembers.length;

      renderer.updateTeamMember(-1, 'name', 'Invalid');
      renderer.updateTeamMember(999, 'name', 'Invalid');

      expect(renderer.state.sprint.teamMembers).toHaveLength(initialLength);
    });
  });

  describe('Calculation Integration', () => {
    beforeEach(() => {
      renderer.state.sprint.sprintStarts = '2025-09-27';
      renderer.state.sprint.sprintEnds = '2025-10-15';
      renderer.state.sprint.teamVelocity = 100;
      renderer.state.sprint.reservedCapacity = 10;
    });

    it('should calculate team details correctly with multiple members', () => {
      renderer.addTeamMember();
      renderer.updateTeamMember(0, 'name', 'Alice');
      renderer.updateTeamMember(0, 'availableDays', 10);

      renderer.addTeamMember();
      renderer.updateTeamMember(1, 'name', 'Bob');
      renderer.updateTeamMember(1, 'availableDays', 8);

      renderer.updateAllCalculations();

      expect(renderer.state.calculations.teamSize).toBe(2);
      expect(renderer.state.calculations.totalTeamDays).toBe(18);
      expect(renderer.state.calculations.totalTeamCapacity).toBeCloseTo(69.23, 1);
      expect(renderer.state.calculations.targetStoryPoints).toBe(62);
    });

    it('should distribute story points proportionally among team members', () => {
      renderer.addTeamMember();
      renderer.updateTeamMember(0, 'availableDays', 10);

      renderer.addTeamMember();
      renderer.updateTeamMember(1, 'availableDays', 5);

      renderer.updateAllCalculations();

      const totalCapacity = renderer.state.sprint.teamMembers.reduce(
        (sum, member) => sum + (member.storyPointCapacity || 0),
        0
      );

      expect(totalCapacity).toBe(renderer.state.calculations.targetStoryPoints);
      expect(renderer.state.sprint.teamMembers[0].storyPointCapacity).toBeGreaterThan(
        renderer.state.sprint.teamMembers[1].storyPointCapacity || 0
      );
    });

    it('should recalculate when team velocity changes', () => {
      renderer.addTeamMember();
      renderer.updateTeamMember(0, 'availableDays', 10);

      renderer.state.sprint.teamVelocity = 200;
      renderer.updateAllCalculations();

      const highVelocityTarget = renderer.state.calculations.targetStoryPoints;

      renderer.state.sprint.teamVelocity = 50;
      renderer.updateAllCalculations();

      const lowVelocityTarget = renderer.state.calculations.targetStoryPoints;

      expect(highVelocityTarget).toBeGreaterThan(lowVelocityTarget);
    });

    it('should recalculate when reserved capacity changes', () => {
      renderer.addTeamMember();
      renderer.updateTeamMember(0, 'availableDays', 10);

      renderer.state.sprint.reservedCapacity = 0;
      renderer.updateAllCalculations();

      const noReservedTarget = renderer.state.calculations.targetStoryPoints;

      renderer.state.sprint.reservedCapacity = 50;
      renderer.updateAllCalculations();

      const highReservedTarget = renderer.state.calculations.targetStoryPoints;

      expect(noReservedTarget).toBeGreaterThan(highReservedTarget);
    });
  });

  describe('Template Management', () => {
    it('should load template data correctly', () => {
      const template: SprintTemplate = {
        teamVelocity: 120,
        sprintStarts: '2025-01-01',
        sprintEnds: '2025-01-15',
        reservedCapacity: 15,
        teamMembers: [
          { name: 'Alice', availableDays: 10, ptoDates: '', storyPointCapacity: 0 },
          { name: 'Bob', availableDays: 8, ptoDates: '1/3', storyPointCapacity: 0 }
        ]
      };

      renderer.loadTemplateData(template);

      expect(renderer.state.sprint.teamVelocity).toBe(120);
      expect(renderer.state.sprint.sprintStarts).toBe('2025-01-01');
      expect(renderer.state.sprint.sprintEnds).toBe('2025-01-15');
      expect(renderer.state.sprint.reservedCapacity).toBe(15);
      expect(renderer.state.sprint.teamMembers).toHaveLength(2);
      expect(renderer.state.sprint.teamMembers[0].name).toBe('Alice');
      expect(renderer.state.sprint.teamMembers[1].name).toBe('Bob');
    });

    it('should update calculations after loading template', () => {
      const template: SprintTemplate = {
        teamVelocity: 80,
        sprintStarts: '2025-09-29', // Monday
        sprintEnds: '2025-10-10',   // Friday
        reservedCapacity: 20,
        teamMembers: [
          { name: 'Charlie', availableDays: 10, ptoDates: '', storyPointCapacity: 0 }
        ]
      };

      renderer.loadTemplateData(template);

      expect(renderer.state.calculations.sprintDays).toBe(10); // 2 weeks of working days
      expect(renderer.state.calculations.teamSize).toBe(1);
      expect(renderer.state.calculations.totalTeamDays).toBe(10);
      expect(renderer.state.calculations.totalTeamCapacity).toBe(100);
      expect(renderer.state.calculations.targetStoryPoints).toBe(64); // 80 * 1.0 * 0.8
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero team members gracefully', () => {
      renderer.state.sprint.sprintStarts = '2025-09-27';
      renderer.state.sprint.sprintEnds = '2025-10-15';

      renderer.updateAllCalculations();

      expect(renderer.state.calculations.teamSize).toBe(0);
      expect(renderer.state.calculations.totalTeamDays).toBe(0);
      expect(renderer.state.calculations.totalTeamCapacity).toBe(0);
      expect(renderer.state.calculations.targetStoryPoints).toBe(0);
    });

    it('should handle invalid date ranges', () => {
      renderer.state.sprint.sprintStarts = '2025-10-15';
      renderer.state.sprint.sprintEnds = '2025-09-27'; // End before start

      renderer.calculateSprintDays();

      expect(renderer.state.calculations.sprintDays).toBe(0);
    });

    it('should handle team members with zero availability', () => {
      renderer.addTeamMember();
      renderer.updateTeamMember(0, 'availableDays', 0);

      renderer.state.sprint.sprintStarts = '2025-09-27';
      renderer.state.sprint.sprintEnds = '2025-10-15';

      renderer.updateAllCalculations();

      expect(renderer.state.calculations.totalTeamDays).toBe(0);
      expect(renderer.state.calculations.totalTeamCapacity).toBe(0);
      expect(renderer.state.sprint.teamMembers[0].storyPointCapacity).toBe(0);
    });

    it('should handle extreme reserved capacity values', () => {
      renderer.addTeamMember();
      renderer.updateTeamMember(0, 'availableDays', 10);

      renderer.state.sprint.sprintStarts = '2025-09-27';
      renderer.state.sprint.sprintEnds = '2025-10-15';
      renderer.state.sprint.teamVelocity = 100;

      // 100% reserved capacity
      renderer.state.sprint.reservedCapacity = 100;
      renderer.updateAllCalculations();

      expect(renderer.state.calculations.targetStoryPoints).toBe(0);

      // Negative reserved capacity (should still work)
      renderer.state.sprint.reservedCapacity = -10;
      renderer.updateAllCalculations();

      expect(renderer.state.calculations.targetStoryPoints).toBeGreaterThan(0);
    });
  });
});