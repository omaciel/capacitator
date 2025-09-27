// Types
interface TeamMember {
  name: string;
  availableDays: number;
  ptoDates: string;
  storyPointCapacity?: number;
}

interface SprintTemplate {
  teamVelocity: number;
  sprintStarts: string;
  sprintEnds: string;
  reservedCapacity: number;
  teamMembers: TeamMember[];
}

interface SprintCalculations {
  sprintDays: number;
  teamSize: number;
  totalTeamDays: number;
  totalTeamCapacity: number;
  targetStoryPoints: number;
}

interface AppState {
  sprint: SprintTemplate;
  calculations: SprintCalculations;
}

// Utility functions
class SprintCalculator {
  static calculateSprintDays(startDate: Date, endDate: Date): number {
    if (endDate < startDate) {
      return 0;
    }

    let workingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Saturdays and Sundays
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }

  static calculateTotalTeamDays(teamMembers: TeamMember[]): number {
    return teamMembers.reduce((total, member) => total + member.availableDays, 0);
  }

  static calculateTeamCapacity(totalTeamDays: number, teamSize: number, sprintDays: number): number {
    if (teamSize === 0 || sprintDays === 0) {
      return 0;
    }
    return (totalTeamDays / (teamSize * sprintDays)) * 100;
  }

  static calculateTargetStoryPoints(
    teamVelocity: number,
    teamCapacity: number,
    reservedCapacity: number
  ): number {
    const reservedFraction = reservedCapacity / 100;
    const adjustedCapacity = teamCapacity * (1 - reservedFraction);
    return Math.round((adjustedCapacity / 100) * teamVelocity);
  }

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

  static hasLowAvailability(member: TeamMember): boolean {
    return member.availableDays < 5;
  }
}

// Main Application Class
class CapacitatorRenderer {
  private state: AppState;

  constructor() {
    this.state = {
      sprint: {
        teamVelocity: 88,
        sprintStarts: '',
        sprintEnds: '',
        reservedCapacity: 10,
        teamMembers: []
      },
      calculations: {
        sprintDays: 0,
        teamSize: 0,
        totalTeamDays: 0,
        totalTeamCapacity: 0,
        targetStoryPoints: 0
      }
    };

    this.initializeApp();
  }

  private initializeApp(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApp());
    } else {
      this.setupApp();
    }
  }

  private setupApp(): void {
    this.setupEventListeners();
    this.setupMenuListeners();
    this.setDefaultDates();
    this.updateAllCalculations();
  }

  private setupEventListeners(): void {
    console.log('Setting up event listeners...');

    // Form input listeners
    const teamVelocityEl = this.getElementById<HTMLInputElement>('teamVelocity');
    teamVelocityEl.addEventListener('input', () => {
      this.state.sprint.teamVelocity = Number(teamVelocityEl.value);
      this.updateAllCalculations();
    });

    const sprintStartsEl = this.getElementById<HTMLInputElement>('sprintStarts');
    sprintStartsEl.addEventListener('change', () => {
      this.state.sprint.sprintStarts = sprintStartsEl.value;
      console.log('Sprint starts changed to:', sprintStartsEl.value);
      this.updateSprintEndMinDate();
      this.updateAllCalculations();
    });

    const sprintEndsEl = this.getElementById<HTMLInputElement>('sprintEnds');
    sprintEndsEl.addEventListener('change', () => {
      this.state.sprint.sprintEnds = sprintEndsEl.value;
      console.log('Sprint ends changed to:', sprintEndsEl.value);
      this.updateAllCalculations();
    });

    const reservedCapacityEl = this.getElementById<HTMLInputElement>('reservedCapacity');
    reservedCapacityEl.addEventListener('input', () => {
      this.state.sprint.reservedCapacity = Number(reservedCapacityEl.value);
      this.updateAllCalculations();
    });

    // Button listeners
    this.getElementById('addMemberBtn').addEventListener('click', () => {
      console.log('Add member button clicked');
      this.addTeamMember();
    });

    this.getElementById('saveTemplateBtn').addEventListener('click', () => {
      console.log('Save template button clicked');
      this.saveTemplate();
    });

    this.getElementById('loadTemplateBtn').addEventListener('click', () => {
      console.log('Load template button clicked');
      this.loadTemplate();
    });

    // Modal listeners
    this.getElementById('modalClose').addEventListener('click', () => this.hideModal());
    this.getElementById('modalOk').addEventListener('click', () => this.hideModal());
    this.getElementById('modal').addEventListener('click', (e) => {
      if (e.target === this.getElementById('modal')) {
        this.hideModal();
      }
    });

    console.log('Event listeners setup complete');
  }

  private setupMenuListeners(): void {
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((action: string) => {
        switch (action) {
          case 'new-template':
            this.newTemplate();
            break;
          case 'save-template':
            this.saveTemplate();
            break;
          case 'load-template':
            this.loadTemplate();
            break;
          case 'about':
            this.showAbout();
            break;
        }
      });
    }
  }

  private setDefaultDates(): void {
    const today = new Date().toISOString().split('T')[0];
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    const sprintEndsDate = twoWeeksLater.toISOString().split('T')[0];

    this.getElementById<HTMLInputElement>('sprintStarts').value = today;
    this.getElementById<HTMLInputElement>('sprintEnds').value = sprintEndsDate;
    this.getElementById<HTMLInputElement>('sprintEnds').setAttribute('min', today);

    this.state.sprint.sprintStarts = today;
    this.state.sprint.sprintEnds = sprintEndsDate;
  }

  private updateSprintEndMinDate(): void {
    const sprintStartDate = this.getElementById<HTMLInputElement>('sprintStarts').value;
    this.getElementById<HTMLInputElement>('sprintEnds').setAttribute('min', sprintStartDate);
  }

  private updateAllCalculations(): void {
    console.log('Updating all calculations...');
    this.calculateSprintDays();
    this.calculateTeamDetails();
    this.updateDisplay();
    this.updateTeamMemberCapacities();
  }

  private calculateSprintDays(): void {
    // Parse dates as local dates to avoid timezone issues
    const startDate = new Date(this.state.sprint.sprintStarts + 'T00:00:00');
    const endDate = new Date(this.state.sprint.sprintEnds + 'T00:00:00');

    this.state.calculations.sprintDays = SprintCalculator.calculateSprintDays(startDate, endDate);
    console.log('Calculated sprint days:', this.state.calculations.sprintDays);
  }

  private calculateTeamDetails(): void {
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

  private updateDisplay(): void {
    this.getElementById('sprintDays').textContent = this.state.calculations.sprintDays.toString();
    this.getElementById('teamSize').textContent = this.state.calculations.teamSize.toString();
    this.getElementById('totalTeamDays').textContent = this.state.calculations.totalTeamDays.toString();
    this.getElementById('totalTeamCapacity').textContent = this.state.calculations.totalTeamCapacity.toFixed(2);
    this.getElementById('targetStoryPoints').textContent = this.state.calculations.targetStoryPoints.toString();
  }

  private addTeamMember(): void {
    console.log('Adding team member...');
    const newMember: TeamMember = {
      name: '',
      availableDays: this.state.calculations.sprintDays,
      ptoDates: '',
      storyPointCapacity: 0
    };

    this.state.sprint.teamMembers.push(newMember);
    this.renderTeamTable();
    this.updateAllCalculations();
  }

  private removeTeamMemberInternal(index: number): void {
    this.state.sprint.teamMembers.splice(index, 1);
    this.renderTeamTable();
    this.updateAllCalculations();
  }

  private updateTeamMemberInternal(index: number, field: keyof TeamMember, value: string | number): void {
    if (index >= 0 && index < this.state.sprint.teamMembers.length) {
      (this.state.sprint.teamMembers[index] as any)[field] = value;
      this.updateAllCalculations();
      this.updateRowAppearance(index);
    }
  }

  private updateTeamMemberCapacities(): void {
    this.state.sprint.teamMembers = SprintCalculator.calculateIndividualCapacity(
      this.state.sprint.teamMembers,
      this.state.calculations.targetStoryPoints,
      this.state.calculations.totalTeamDays
    );

    // Update the table display
    this.state.sprint.teamMembers.forEach((member, index) => {
      const capacityCell = this.querySelector<HTMLElement>(`#team-row-${index} .capacity-display`);
      if (capacityCell) {
        capacityCell.textContent = member.storyPointCapacity?.toString() || '0';
      }
    });
  }

  private renderTeamTable(): void {
    const tbody = this.getElementById('teamTableBody');
    tbody.innerHTML = '';

    this.state.sprint.teamMembers.forEach((member, index) => {
      const row = document.createElement('tr');
      row.id = `team-row-${index}`;

      if (SprintCalculator.hasLowAvailability(member)) {
        row.classList.add('low-availability');
      }

      row.innerHTML = `
        <td>
          <input type="text" class="table-input" value="${member.name}"
                 onchange="window.renderer.updateTeamMember(${index}, 'name', this.value)">
        </td>
        <td>
          <input type="number" class="table-input" value="${member.availableDays}"
                 onchange="window.renderer.updateTeamMember(${index}, 'availableDays', Number(this.value))"
                 min="0" step="0.5">
        </td>
        <td>
          <input type="text" class="table-input" value="${member.ptoDates}"
                 onchange="window.renderer.updateTeamMember(${index}, 'ptoDates', this.value)"
                 placeholder="e.g., 12/25-12/26">
        </td>
        <td class="capacity-display">${member.storyPointCapacity || 0}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="window.renderer.removeTeamMember(${index})">
            🗑️ Delete
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  private updateRowAppearance(index: number): void {
    const row = this.getElementById(`team-row-${index}`);
    const member = this.state.sprint.teamMembers[index];

    if (SprintCalculator.hasLowAvailability(member)) {
      row.classList.add('low-availability');
    } else {
      row.classList.remove('low-availability');
    }
  }

  private async saveTemplate(): Promise<void> {
    if (!window.electronAPI) {
      this.showModal('Error', 'File operations are not available in this environment.');
      return;
    }

    try {
      this.showLoading(true);
      const result = await window.electronAPI.saveTemplate(this.state.sprint);

      if (result.success) {
        this.showModal('Success', 'Template saved successfully!');
      } else {
        this.showModal('Error', result.error || 'Failed to save template.');
      }
    } catch (error) {
      this.showModal('Error', 'An unexpected error occurred while saving.');
    } finally {
      this.showLoading(false);
    }
  }

  private async loadTemplate(): Promise<void> {
    if (!window.electronAPI) {
      this.showModal('Error', 'File operations are not available in this environment.');
      return;
    }

    try {
      this.showLoading(true);
      const result = await window.electronAPI.loadTemplate();

      if (result.success && result.template) {
        this.loadTemplateData(result.template);
        this.showModal('Success', 'Template loaded successfully!');
      } else if (result.error) {
        this.showModal('Error', result.error);
      }
    } catch (error) {
      this.showModal('Error', 'An unexpected error occurred while loading.');
    } finally {
      this.showLoading(false);
    }
  }

  private loadTemplateData(template: SprintTemplate): void {
    // Update form fields
    this.getElementById<HTMLInputElement>('teamVelocity').value = template.teamVelocity.toString();
    this.getElementById<HTMLInputElement>('sprintStarts').value = template.sprintStarts;
    this.getElementById<HTMLInputElement>('sprintEnds').value = template.sprintEnds;
    this.getElementById<HTMLInputElement>('reservedCapacity').value = template.reservedCapacity.toString();

    // Update state
    this.state.sprint = { ...template };

    // Update calculations and display
    this.updateSprintEndMinDate();
    this.renderTeamTable();
    this.updateAllCalculations();
  }

  private newTemplate(): void {
    this.state.sprint = {
      teamVelocity: 88,
      sprintStarts: '',
      sprintEnds: '',
      reservedCapacity: 10,
      teamMembers: []
    };

    this.getElementById<HTMLInputElement>('teamVelocity').value = '88';
    this.getElementById<HTMLInputElement>('reservedCapacity').value = '10';

    this.setDefaultDates();
    this.renderTeamTable();
    this.updateAllCalculations();
  }

  private async showAbout(): Promise<void> {
    if (window.electronAPI) {
      try {
        const appInfo = await window.electronAPI.getAppInfo();
        this.showModal(
          'About Capacitator',
          `${appInfo.name} v${appInfo.version}\n\nA Sprint Planning Calculator for Agile teams.\n\nPlatform: ${appInfo.platform}\n\nFor more information, visit:\nhttps://github.com/omaciel/capacitator`
        );
      } catch {
        this.showModal('About Capacitator', 'Sprint Planning Calculator for Agile teams.');
      }
    }
  }

  private showModal(title: string, message: string): void {
    this.getElementById('modalTitle').textContent = title;
    this.getElementById('modalMessage').textContent = message;
    this.getElementById('modal').classList.remove('hidden');
  }

  private hideModal(): void {
    this.getElementById('modal').classList.add('hidden');
  }

  private showLoading(show: boolean): void {
    const indicator = this.getElementById('loadingIndicator');
    if (show) {
      indicator.classList.remove('hidden');
    } else {
      indicator.classList.add('hidden');
    }
  }

  private getElementById<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id) as T;
    if (!element) {
      throw new Error(`Element with id '${id}' not found`);
    }
    return element;
  }

  private querySelector<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return document.querySelector(selector) as T;
  }

  // Public methods for global access
  public updateTeamMember(index: number, field: keyof TeamMember, value: string | number): void {
    this.updateTeamMemberInternal(index, field, value);
  }

  public removeTeamMember(index: number): void {
    this.removeTeamMemberInternal(index);
  }
}

// Initialize the application and make it globally available
const renderer = new CapacitatorRenderer();
(window as any).renderer = renderer;

// Export for module system
export default renderer;