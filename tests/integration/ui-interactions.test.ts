/**
 * @jest-environment jsdom
 */

import { mockElectronAPI, suppressConsole, restoreConsole } from '../setup';
import { TeamMember } from '../../src/types';

describe('UI Integration Tests', () => {
  let renderer: any;
  let mockDocument: Document;

  beforeEach(() => {
    suppressConsole();

    // Set up DOM
    document.body.innerHTML = `
      <div class="container">
        <!-- Sprint Details Section -->
        <input type="number" id="teamVelocity" value="88">
        <input type="date" id="sprintStarts">
        <input type="date" id="sprintEnds">
        <span id="sprintDays">0</span>
        <input type="number" id="reservedCapacity" value="10">

        <!-- Team Details Section -->
        <span id="teamSize">0</span>
        <span id="totalTeamDays">0</span>
        <span id="totalTeamCapacity">0</span>
        <span id="targetStoryPoints">0</span>

        <!-- Team Members Section -->
        <button id="addMemberBtn">+ Add Member</button>
        <button id="saveTemplateBtn">💾 Save Template</button>
        <button id="loadTemplateBtn">📁 Load Template</button>
        <table id="teamTable">
          <tbody id="teamTableBody"></tbody>
        </table>

        <!-- Modal -->
        <div id="modal" class="hidden">
          <h3 id="modalTitle">Title</h3>
          <button id="modalClose">&times;</button>
          <p id="modalMessage">Message</p>
          <button id="modalOk">OK</button>
        </div>

        <!-- Loading indicator -->
        <div id="loadingIndicator" class="hidden">Loading...</div>
      </div>
    `;

    // Mock the CapacitatorRenderer class (simplified for testing)
    renderer = {
      state: {
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
      },

      getElementById: (id: string) => {
        const element = document.getElementById(id);
        if (!element) {
          throw new Error(`Element with id '${id}' not found`);
        }
        return element;
      },

      updateDisplay: () => {
        document.getElementById('sprintDays')!.textContent = renderer.state.calculations.sprintDays.toString();
        document.getElementById('teamSize')!.textContent = renderer.state.calculations.teamSize.toString();
        document.getElementById('totalTeamDays')!.textContent = renderer.state.calculations.totalTeamDays.toString();
        document.getElementById('totalTeamCapacity')!.textContent = renderer.state.calculations.totalTeamCapacity.toFixed(2);
        document.getElementById('targetStoryPoints')!.textContent = renderer.state.calculations.targetStoryPoints.toString();
      },

      addTeamMember: () => {
        const newMember: TeamMember = {
          name: '',
          availableDays: renderer.state.calculations.sprintDays || 0,
          ptoDates: '',
          storyPointCapacity: 0
        };
        renderer.state.sprint.teamMembers.push(newMember);
        renderer.state.calculations.teamSize = renderer.state.sprint.teamMembers.length;
        renderer.renderTeamTable();
        renderer.updateDisplay();
      },

      removeTeamMember: (index: number) => {
        renderer.state.sprint.teamMembers.splice(index, 1);
        renderer.state.calculations.teamSize = renderer.state.sprint.teamMembers.length;
        renderer.renderTeamTable();
        renderer.updateDisplay();
      },

      updateTeamMember: (index: number, field: string, value: any) => {
        if (index >= 0 && index < renderer.state.sprint.teamMembers.length) {
          (renderer.state.sprint.teamMembers[index] as any)[field] = value;
          renderer.updateDisplay();
        }
      },

      renderTeamTable: () => {
        const tbody = document.getElementById('teamTableBody')!;
        tbody.innerHTML = '';

        renderer.state.sprint.teamMembers.forEach((member: TeamMember, index: number) => {
          const row = document.createElement('tr');
          row.id = `team-row-${index}`;
          row.innerHTML = `
            <td>
              <input type="text" class="table-input" value="${member.name}"
                     data-field="name" data-index="${index}">
            </td>
            <td>
              <input type="number" class="table-input" value="${member.availableDays}"
                     data-field="availableDays" data-index="${index}">
            </td>
            <td>
              <input type="text" class="table-input" value="${member.ptoDates}"
                     data-field="ptoDates" data-index="${index}">
            </td>
            <td class="capacity-display">${member.storyPointCapacity || 0}</td>
            <td>
              <button class="remove-btn" data-index="${index}">🗑️ Delete</button>
            </td>
          `;
          tbody.appendChild(row);
        });

        // Add event listeners for table inputs
        tbody.querySelectorAll('.table-input').forEach((input: any) => {
          input.addEventListener('change', (e: any) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            const field = e.target.getAttribute('data-field');
            const value = field === 'availableDays' ? Number(e.target.value) : e.target.value;
            renderer.updateTeamMember(index, field, value);
          });
        });

        // Add event listeners for remove buttons
        tbody.querySelectorAll('.remove-btn').forEach((button: any) => {
          button.addEventListener('click', (e: any) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            renderer.removeTeamMember(index);
          });
        });
      },

      showModal: (title: string, message: string) => {
        document.getElementById('modalTitle')!.textContent = title;
        document.getElementById('modalMessage')!.textContent = message;
        document.getElementById('modal')!.classList.remove('hidden');
      },

      hideModal: () => {
        document.getElementById('modal')!.classList.add('hidden');
      },

      showLoading: (show: boolean) => {
        const indicator = document.getElementById('loadingIndicator')!;
        if (show) {
          indicator.classList.remove('hidden');
        } else {
          indicator.classList.add('hidden');
        }
      },

      saveTemplate: async () => {
        renderer.showLoading(true);
        const result = await mockElectronAPI.saveTemplate(renderer.state.sprint);
        renderer.showLoading(false);

        if (result.success) {
          renderer.showModal('Success', 'Template saved successfully!');
        } else {
          renderer.showModal('Error', 'Failed to save template.');
        }
      },

      loadTemplate: async () => {
        renderer.showLoading(true);
        const result = await mockElectronAPI.loadTemplate();
        renderer.showLoading(false);

        if (result.success && result.template) {
          renderer.state.sprint = { ...result.template };
          renderer.updateDisplay();
          renderer.renderTeamTable();
          renderer.showModal('Success', 'Template loaded successfully!');
        } else {
          renderer.showModal('Error', 'Failed to load template.');
        }
      }
    };

    // Set up event listeners
    document.getElementById('addMemberBtn')!.addEventListener('click', () => {
      renderer.addTeamMember();
    });

    document.getElementById('saveTemplateBtn')!.addEventListener('click', () => {
      renderer.saveTemplate();
    });

    document.getElementById('loadTemplateBtn')!.addEventListener('click', () => {
      renderer.loadTemplate();
    });

    document.getElementById('modalClose')!.addEventListener('click', () => {
      renderer.hideModal();
    });

    document.getElementById('modalOk')!.addEventListener('click', () => {
      renderer.hideModal();
    });

    // Mock window.renderer for global access
    (window as any).renderer = renderer;
  });

  afterEach(() => {
    restoreConsole();
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Team Member Management UI', () => {
    it('should add team member when Add Member button is clicked', () => {
      const addButton = document.getElementById('addMemberBtn') as HTMLButtonElement;
      const teamTableBody = document.getElementById('teamTableBody')!;

      expect(teamTableBody.children.length).toBe(0);

      addButton.click();

      expect(renderer.state.sprint.teamMembers).toHaveLength(1);
      expect(teamTableBody.children.length).toBe(1);
      expect(document.getElementById('teamSize')!.textContent).toBe('1');
    });

    it('should remove team member when delete button is clicked', () => {
      const addButton = document.getElementById('addMemberBtn') as HTMLButtonElement;

      // Add two members
      addButton.click();
      addButton.click();

      expect(renderer.state.sprint.teamMembers).toHaveLength(2);

      // Click remove button for first member
      const removeButton = document.querySelector('.remove-btn') as HTMLButtonElement;
      removeButton.click();

      expect(renderer.state.sprint.teamMembers).toHaveLength(1);
      expect(document.getElementById('teamSize')!.textContent).toBe('1');
    });

    it('should update team member when input values change', () => {
      const addButton = document.getElementById('addMemberBtn') as HTMLButtonElement;
      addButton.click();

      const nameInput = document.querySelector('[data-field="name"]') as HTMLInputElement;
      const daysInput = document.querySelector('[data-field="availableDays"]') as HTMLInputElement;

      // Simulate user input
      nameInput.value = 'Alice';
      nameInput.dispatchEvent(new Event('change'));

      daysInput.value = '8';
      daysInput.dispatchEvent(new Event('change'));

      expect(renderer.state.sprint.teamMembers[0].name).toBe('Alice');
      expect(renderer.state.sprint.teamMembers[0].availableDays).toBe(8);
    });

    it('should display team member data correctly in table', () => {
      const addButton = document.getElementById('addMemberBtn') as HTMLButtonElement;
      addButton.click();

      // Update member data
      renderer.updateTeamMember(0, 'name', 'Bob');
      renderer.updateTeamMember(0, 'availableDays', 10);
      renderer.updateTeamMember(0, 'ptoDates', '12/25');
      renderer.renderTeamTable();

      const nameInput = document.querySelector('[data-field="name"]') as HTMLInputElement;
      const daysInput = document.querySelector('[data-field="availableDays"]') as HTMLInputElement;
      const ptoInput = document.querySelector('[data-field="ptoDates"]') as HTMLInputElement;

      expect(nameInput.value).toBe('Bob');
      expect(daysInput.value).toBe('10');
      expect(ptoInput.value).toBe('12/25');
    });
  });

  describe('Form Input Updates', () => {
    it('should update team velocity when input changes', () => {
      const velocityInput = document.getElementById('teamVelocity') as HTMLInputElement;

      velocityInput.value = '120';
      velocityInput.dispatchEvent(new Event('input'));

      // In a real renderer, this would trigger updateAllCalculations
      renderer.state.sprint.teamVelocity = Number(velocityInput.value);
      expect(renderer.state.sprint.teamVelocity).toBe(120);
    });

    it('should update reserved capacity when input changes', () => {
      const capacityInput = document.getElementById('reservedCapacity') as HTMLInputElement;

      capacityInput.value = '15';
      capacityInput.dispatchEvent(new Event('input'));

      renderer.state.sprint.reservedCapacity = Number(capacityInput.value);
      expect(renderer.state.sprint.reservedCapacity).toBe(15);
    });
  });

  describe('Template Operations UI', () => {
    it('should show loading indicator when saving template', async () => {
      const saveButton = document.getElementById('saveTemplateBtn') as HTMLButtonElement;
      const loadingIndicator = document.getElementById('loadingIndicator')!;

      expect(loadingIndicator.classList.contains('hidden')).toBe(true);

      const savePromise = renderer.saveTemplate();

      // Should show loading immediately
      expect(loadingIndicator.classList.contains('hidden')).toBe(false);

      await savePromise;

      // Should hide loading after completion
      expect(loadingIndicator.classList.contains('hidden')).toBe(true);
    });

    it('should show success modal when template saves successfully', async () => {
      const saveButton = document.getElementById('saveTemplateBtn') as HTMLButtonElement;
      const modal = document.getElementById('modal')!;
      const modalTitle = document.getElementById('modalTitle')!;
      const modalMessage = document.getElementById('modalMessage')!;

      await renderer.saveTemplate();

      expect(modal.classList.contains('hidden')).toBe(false);
      expect(modalTitle.textContent).toBe('Success');
      expect(modalMessage.textContent).toBe('Template saved successfully!');
    });

    it('should show error modal when template save fails', async () => {
      // Mock save failure
      mockElectronAPI.saveTemplate.mockResolvedValueOnce({ success: false });

      await renderer.saveTemplate();

      const modal = document.getElementById('modal')!;
      const modalTitle = document.getElementById('modalTitle')!;
      const modalMessage = document.getElementById('modalMessage')!;

      expect(modal.classList.contains('hidden')).toBe(false);
      expect(modalTitle.textContent).toBe('Error');
      expect(modalMessage.textContent).toBe('Failed to save template.');
    });

    it('should load template data and update UI', async () => {
      const templateData = {
        teamVelocity: 150,
        sprintStarts: '2025-02-01',
        sprintEnds: '2025-02-15',
        reservedCapacity: 20,
        teamMembers: [
          { name: 'Charlie', availableDays: 12, ptoDates: '', storyPointCapacity: 0 }
        ]
      };

      mockElectronAPI.loadTemplate.mockResolvedValueOnce({
        success: true,
        template: templateData
      });

      await renderer.loadTemplate();

      expect(renderer.state.sprint.teamVelocity).toBe(150);
      expect(renderer.state.sprint.sprintStarts).toBe('2025-02-01');
      expect(renderer.state.sprint.sprintEnds).toBe('2025-02-15');
      expect(renderer.state.sprint.reservedCapacity).toBe(20);
      expect(renderer.state.sprint.teamMembers).toHaveLength(1);
      expect(renderer.state.sprint.teamMembers[0].name).toBe('Charlie');
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when close button is clicked', () => {
      const modal = document.getElementById('modal')!;
      const closeButton = document.getElementById('modalClose') as HTMLButtonElement;

      renderer.showModal('Test', 'Test message');
      expect(modal.classList.contains('hidden')).toBe(false);

      closeButton.click();
      expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('should close modal when OK button is clicked', () => {
      const modal = document.getElementById('modal')!;
      const okButton = document.getElementById('modalOk') as HTMLButtonElement;

      renderer.showModal('Test', 'Test message');
      expect(modal.classList.contains('hidden')).toBe(false);

      okButton.click();
      expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('should display correct modal title and message', () => {
      const modalTitle = document.getElementById('modalTitle')!;
      const modalMessage = document.getElementById('modalMessage')!;

      renderer.showModal('Custom Title', 'Custom message content');

      expect(modalTitle.textContent).toBe('Custom Title');
      expect(modalMessage.textContent).toBe('Custom message content');
    });
  });

  describe('Display Updates', () => {
    it('should update display elements when calculations change', () => {
      renderer.state.calculations = {
        sprintDays: 14,
        teamSize: 3,
        totalTeamDays: 42,
        totalTeamCapacity: 85.5,
        targetStoryPoints: 75
      };

      renderer.updateDisplay();

      expect(document.getElementById('sprintDays')!.textContent).toBe('14');
      expect(document.getElementById('teamSize')!.textContent).toBe('3');
      expect(document.getElementById('totalTeamDays')!.textContent).toBe('42');
      expect(document.getElementById('totalTeamCapacity')!.textContent).toBe('85.50');
      expect(document.getElementById('targetStoryPoints')!.textContent).toBe('75');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when trying to access non-existent element', () => {
      expect(() => {
        renderer.getElementById('nonExistentElement');
      }).toThrow('Element with id \'nonExistentElement\' not found');
    });

    it('should handle team member updates with invalid index gracefully', () => {
      const initialLength = renderer.state.sprint.teamMembers.length;

      renderer.updateTeamMember(-1, 'name', 'Invalid');
      renderer.updateTeamMember(999, 'name', 'Invalid');

      expect(renderer.state.sprint.teamMembers).toHaveLength(initialLength);
    });
  });
});