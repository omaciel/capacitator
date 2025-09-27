import { FileOperations } from '../../src/utils/fileOperations';
import { dialog } from 'electron';
import { writeFile, readFile } from 'fs/promises';
import { SprintTemplate } from '../../src/types';

// Mock Electron modules
jest.mock('electron', () => ({
  dialog: {
    showSaveDialog: jest.fn(),
    showOpenDialog: jest.fn(),
  }
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  readFile: jest.fn(),
}));

const mockDialog = dialog as jest.Mocked<typeof dialog>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('FileOperations', () => {
  const mockTemplate: SprintTemplate = {
    teamVelocity: 88,
    sprintStarts: '2025-09-27',
    sprintEnds: '2025-10-15',
    reservedCapacity: 10,
    teamMembers: [
      { name: 'Alice', availableDays: 10, ptoDates: '', storyPointCapacity: 0 },
      { name: 'Bob', availableDays: 8, ptoDates: '10/1', storyPointCapacity: 0 }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTemplate', () => {
    it('should save template successfully when user selects file', async () => {
      const mockFilePath = '/Users/test/template.json';
      mockDialog.showSaveDialog.mockResolvedValue({
        canceled: false,
        filePath: mockFilePath
      });
      mockWriteFile.mockResolvedValue();

      await FileOperations.saveTemplate(mockTemplate);

      expect(mockDialog.showSaveDialog).toHaveBeenCalledWith({
        title: 'Save Sprint Template',
        defaultPath: 'sprint_template.json',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      expect(mockWriteFile).toHaveBeenCalledWith(
        mockFilePath,
        JSON.stringify(mockTemplate, null, 2),
        'utf-8'
      );
    });

    it('should not save when user cancels dialog', async () => {
      mockDialog.showSaveDialog.mockResolvedValue({
        canceled: true
      } as any);

      await FileOperations.saveTemplate(mockTemplate);

      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should throw error when file write fails', async () => {
      const mockFilePath = '/Users/test/template.json';
      const writeError = new Error('Permission denied');

      mockDialog.showSaveDialog.mockResolvedValue({
        canceled: false,
        filePath: mockFilePath
      });
      mockWriteFile.mockRejectedValue(writeError);

      await expect(FileOperations.saveTemplate(mockTemplate))
        .rejects.toThrow('Failed to save template: Permission denied');
    });

    it('should throw error when dialog fails', async () => {
      const dialogError = new Error('Dialog failed');
      mockDialog.showSaveDialog.mockRejectedValue(dialogError);

      await expect(FileOperations.saveTemplate(mockTemplate))
        .rejects.toThrow('Failed to save template: Dialog failed');
    });
  });

  describe('loadTemplate', () => {
    it('should load template successfully when user selects valid file', async () => {
      const mockFilePath = '/Users/test/template.json';
      const templateJson = JSON.stringify(mockTemplate);

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      });
      mockReadFile.mockResolvedValue(templateJson);

      const result = await FileOperations.loadTemplate();

      expect(mockDialog.showOpenDialog).toHaveBeenCalledWith({
        title: 'Load Sprint Template',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      expect(mockReadFile).toHaveBeenCalledWith(mockFilePath, 'utf-8');
      expect(result).toEqual(mockTemplate);
    });

    it('should return null when user cancels dialog', async () => {
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: []
      });

      const result = await FileOperations.loadTemplate();

      expect(mockReadFile).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when no files selected', async () => {
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: []
      });

      const result = await FileOperations.loadTemplate();

      expect(mockReadFile).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should throw error when file read fails', async () => {
      const mockFilePath = '/Users/test/template.json';
      const readError = new Error('File not found');

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      });
      mockReadFile.mockRejectedValue(readError);

      await expect(FileOperations.loadTemplate())
        .rejects.toThrow('Failed to load template: File not found');
    });

    it('should throw error when JSON is invalid', async () => {
      const mockFilePath = '/Users/test/template.json';
      const invalidJson = '{ invalid json content';

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      });
      mockReadFile.mockResolvedValue(invalidJson);

      await expect(FileOperations.loadTemplate())
        .rejects.toThrow(/Failed to load template/);
    });

    it('should throw error when template validation fails', async () => {
      const mockFilePath = '/Users/test/template.json';
      const invalidTemplate = { invalidProperty: 'test' };

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      });
      mockReadFile.mockResolvedValue(JSON.stringify(invalidTemplate));

      await expect(FileOperations.loadTemplate())
        .rejects.toThrow('Failed to load template: Invalid template format');
    });

    it('should throw error when dialog fails', async () => {
      const dialogError = new Error('Dialog failed');
      mockDialog.showOpenDialog.mockRejectedValue(dialogError);

      await expect(FileOperations.loadTemplate())
        .rejects.toThrow('Failed to load template: Dialog failed');
    });

    it('should validate template structure correctly', async () => {
      const mockFilePath = '/Users/test/template.json';
      const validTemplate: SprintTemplate = {
        teamVelocity: 100,
        sprintStarts: '2025-01-01',
        sprintEnds: '2025-01-15',
        reservedCapacity: 15,
        teamMembers: [
          { name: 'Charlie', availableDays: 12, ptoDates: '1/3', storyPointCapacity: 0 }
        ]
      };

      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: [mockFilePath]
      });
      mockReadFile.mockResolvedValue(JSON.stringify(validTemplate));

      const result = await FileOperations.loadTemplate();

      expect(result).toEqual(validTemplate);
    });
  });
});