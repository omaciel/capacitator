import { dialog } from 'electron';
import * as fs from 'fs/promises';
import { SprintTemplate } from '../types';

export class FileOperations {
  /**
   * Save sprint template to JSON file
   */
  static async saveTemplate(template: SprintTemplate): Promise<void> {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Save Sprint Template',
        defaultPath: 'sprint_template.json',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        const jsonString = JSON.stringify(template, null, 2);
        await fs.writeFile(result.filePath, jsonString, 'utf-8');
      }
    } catch (error) {
      throw new Error(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load sprint template from JSON file
   */
  static async loadTemplate(): Promise<SprintTemplate | null> {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Load Sprint Template',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const template = JSON.parse(fileContent) as SprintTemplate;

        // Validate the loaded template
        if (!FileOperations.isValidTemplate(template)) {
          throw new Error('Invalid template format');
        }

        return template;
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to load template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate sprint template structure
   */
  private static isValidTemplate(template: any): template is SprintTemplate {
    return (
      typeof template === 'object' &&
      typeof template.teamVelocity === 'number' &&
      typeof template.sprintStarts === 'string' &&
      typeof template.sprintEnds === 'string' &&
      typeof template.reservedCapacity === 'number' &&
      Array.isArray(template.teamMembers) &&
      template.teamMembers.every((member: any) =>
        typeof member.name === 'string' &&
        typeof member.availableDays === 'number' &&
        typeof member.ptoDates === 'string'
      )
    );
  }
}