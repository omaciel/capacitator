// Sprint Calculator - Browser-compatible JavaScript
// No imports/exports - all code in one file for browser compatibility

// Types (using JSDoc for documentation)
/**
 * @typedef {Object} TeamMember
 * @property {string} name
 * @property {number} availableDays
 * @property {string} ptoDates
 * @property {number} [storyPointCapacity]
 */

/**
 * @typedef {Object} SprintTemplate
 * @property {number} teamVelocity
 * @property {string} sprintStarts
 * @property {string} sprintEnds
 * @property {number} reservedCapacity
 * @property {TeamMember[]} teamMembers
 */

// Utility functions
class SprintCalculator {
  static calculateSprintDays(startDate, endDate) {
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

  static calculateTotalTeamDays(teamMembers) {
    return teamMembers.reduce((total, member) => total + member.availableDays, 0);
  }

  static calculateTeamCapacity(totalTeamDays, teamSize, sprintDays) {
    if (teamSize === 0 || sprintDays === 0) {
      return 0;
    }
    return (totalTeamDays / (teamSize * sprintDays)) * 100;
  }

  static calculateTargetStoryPoints(teamVelocity, teamCapacity, reservedCapacity) {
    const reservedFraction = reservedCapacity / 100;
    const adjustedCapacity = teamCapacity * (1 - reservedFraction);
    return Math.round((adjustedCapacity / 100) * teamVelocity);
  }

  static calculateIndividualCapacity(teamMembers, targetStoryPoints, totalTeamDays) {
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
      updatedMembers[randomIndex].storyPointCapacity += diff;
    }

    return updatedMembers;
  }

  static hasLowAvailability(member) {
    return member.availableDays < 5;
  }
}

// Main Application Class
class CapacitatorRenderer {
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

  initializeApp() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApp());
    } else {
      this.setupApp();
    }
  }

  setupApp() {
    console.log('Setting up Capacitator application...');
    this.setupEventListeners();
    this.setupMenuListeners();
    this.setDefaultDates();
    this.updateAllCalculations();
    console.log('Capacitator application setup complete!');
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');

    // Form input listeners
    const teamVelocityEl = this.getElementById('teamVelocity');
    teamVelocityEl.addEventListener('input', () => {
      this.state.sprint.teamVelocity = Number(teamVelocityEl.value);
      console.log('Team velocity changed to:', teamVelocityEl.value);
      this.updateAllCalculations();
    });

    const sprintStartsEl = this.getElementById('sprintStarts');
    sprintStartsEl.addEventListener('change', () => {
      this.state.sprint.sprintStarts = sprintStartsEl.value;
      console.log('Sprint starts changed to:', sprintStartsEl.value);
      this.updateSprintEndMinDate();
      this.updateAllCalculations();
    });

    const sprintEndsEl = this.getElementById('sprintEnds');
    sprintEndsEl.addEventListener('change', () => {
      this.state.sprint.sprintEnds = sprintEndsEl.value;
      console.log('Sprint ends changed to:', sprintEndsEl.value);
      this.updateAllCalculations();
    });

    const reservedCapacityEl = this.getElementById('reservedCapacity');
    reservedCapacityEl.addEventListener('input', () => {
      this.state.sprint.reservedCapacity = Number(reservedCapacityEl.value);
      console.log('Reserved capacity changed to:', reservedCapacityEl.value);
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

  setupMenuListeners() {
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((action) => {
        console.log('Menu action received:', action);
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

  setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    const sprintEndsDate = twoWeeksLater.toISOString().split('T')[0];

    this.getElementById('sprintStarts').value = today;
    this.getElementById('sprintEnds').value = sprintEndsDate;
    this.getElementById('sprintEnds').setAttribute('min', today);

    this.state.sprint.sprintStarts = today;
    this.state.sprint.sprintEnds = sprintEndsDate;

    console.log('Default dates set:', { start: today, end: sprintEndsDate });
  }

  updateSprintEndMinDate() {
    const sprintStartDate = this.getElementById('sprintStarts').value;
    this.getElementById('sprintEnds').setAttribute('min', sprintStartDate);
  }

  updateAllCalculations() {
    console.log('Updating all calculations...');
    this.calculateSprintDays();
    this.calculateTeamDetails();
    this.updateDisplay();
    this.updateTeamMemberCapacities();
    console.log('Calculations updated:', this.state.calculations);
  }

  calculateSprintDays() {
    // Parse dates as local dates to avoid timezone issues
    const startDate = new Date(this.state.sprint.sprintStarts + 'T00:00:00');
    const endDate = new Date(this.state.sprint.sprintEnds + 'T00:00:00');

    this.state.calculations.sprintDays = SprintCalculator.calculateSprintDays(startDate, endDate);
    console.log('Calculated sprint days:', this.state.calculations.sprintDays);
  }

  calculateTeamDetails() {
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

  updateDisplay() {
    this.getElementById('sprintDays').textContent = this.state.calculations.sprintDays.toString();
    this.getElementById('teamSize').textContent = this.state.calculations.teamSize.toString();
    this.getElementById('totalTeamDays').textContent = this.state.calculations.totalTeamDays.toString();
    this.getElementById('totalTeamCapacity').textContent = this.state.calculations.totalTeamCapacity.toFixed(2);
    this.getElementById('targetStoryPoints').textContent = this.state.calculations.targetStoryPoints.toString();
  }

  addTeamMember() {
    console.log('Adding team member...');
    const newMember = {
      name: '',
      availableDays: this.state.calculations.sprintDays,
      ptoDates: '',
      storyPointCapacity: 0
    };

    this.state.sprint.teamMembers.push(newMember);
    this.renderTeamTable();
    this.updateAllCalculations();
  }

  removeTeamMemberInternal(index) {
    console.log('Removing team member at index:', index);
    this.state.sprint.teamMembers.splice(index, 1);
    this.renderTeamTable();
    this.updateAllCalculations();
  }

  updateTeamMemberInternal(index, field, value) {
    if (index >= 0 && index < this.state.sprint.teamMembers.length) {
      console.log(`Updating team member ${index} field ${field} to:`, value);
      this.state.sprint.teamMembers[index][field] = value;
      this.updateAllCalculations();
      this.updateRowAppearance(index);
    }
  }

  updateTeamMemberCapacities() {
    this.state.sprint.teamMembers = SprintCalculator.calculateIndividualCapacity(
      this.state.sprint.teamMembers,
      this.state.calculations.targetStoryPoints,
      this.state.calculations.totalTeamDays
    );

    // Update the table display
    this.state.sprint.teamMembers.forEach((member, index) => {
      const capacityCell = document.querySelector(`#team-row-${index} .capacity-display`);
      if (capacityCell) {
        capacityCell.textContent = member.storyPointCapacity?.toString() || '0';
      }
    });
  }

  renderTeamTable() {
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

  updateRowAppearance(index) {
    const row = this.getElementById(`team-row-${index}`);
    const member = this.state.sprint.teamMembers[index];

    if (SprintCalculator.hasLowAvailability(member)) {
      row.classList.add('low-availability');
    } else {
      row.classList.remove('low-availability');
    }
  }

  async saveTemplate() {
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
      console.error('Save template error:', error);
      this.showModal('Error', 'An unexpected error occurred while saving.');
    } finally {
      this.showLoading(false);
    }
  }

  async loadTemplate() {
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
      console.error('Load template error:', error);
      this.showModal('Error', 'An unexpected error occurred while loading.');
    } finally {
      this.showLoading(false);
    }
  }

  loadTemplateData(template) {
    console.log('Loading template data:', template);

    // Update form fields
    this.getElementById('teamVelocity').value = template.teamVelocity.toString();
    this.getElementById('sprintStarts').value = template.sprintStarts;
    this.getElementById('sprintEnds').value = template.sprintEnds;
    this.getElementById('reservedCapacity').value = template.reservedCapacity.toString();

    // Update state
    this.state.sprint = { ...template };

    // Update calculations and display
    this.updateSprintEndMinDate();
    this.renderTeamTable();
    this.updateAllCalculations();
  }

  newTemplate() {
    console.log('Creating new template...');
    this.state.sprint = {
      teamVelocity: 88,
      sprintStarts: '',
      sprintEnds: '',
      reservedCapacity: 10,
      teamMembers: []
    };

    this.getElementById('teamVelocity').value = '88';
    this.getElementById('reservedCapacity').value = '10';

    this.setDefaultDates();
    this.renderTeamTable();
    this.updateAllCalculations();
  }

  async showAbout() {
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

  showModal(title, message) {
    this.getElementById('modalTitle').textContent = title;
    this.getElementById('modalMessage').textContent = message;
    this.getElementById('modal').classList.remove('hidden');
  }

  hideModal() {
    this.getElementById('modal').classList.add('hidden');
  }

  showLoading(show) {
    const indicator = this.getElementById('loadingIndicator');
    if (show) {
      indicator.classList.remove('hidden');
    } else {
      indicator.classList.add('hidden');
    }
  }

  getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id '${id}' not found`);
    }
    return element;
  }

  // Public methods for global access
  updateTeamMember(index, field, value) {
    this.updateTeamMemberInternal(index, field, value);
  }

  removeTeamMember(index) {
    this.removeTeamMemberInternal(index);
  }
}

// Initialize the application and make it globally available
console.log('Initializing Capacitator renderer...');
const renderer = new CapacitatorRenderer();
window.renderer = renderer;
console.log('Capacitator renderer initialized and available globally');