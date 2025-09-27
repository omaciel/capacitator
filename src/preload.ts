import { contextBridge, ipcRenderer } from 'electron';
import { SprintTemplate } from './types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveTemplate: (template: SprintTemplate) => ipcRenderer.invoke('save-template', template),
  loadTemplate: () => ipcRenderer.invoke('load-template'),

  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Menu events
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-new-template', () => callback('new-template'));
    ipcRenderer.on('menu-save-template', () => callback('save-template'));
    ipcRenderer.on('menu-load-template', () => callback('load-template'));
    ipcRenderer.on('menu-about', () => callback('about'));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      saveTemplate: (template: SprintTemplate) => Promise<{ success: boolean; error?: string }>;
      loadTemplate: () => Promise<{ success: boolean; template?: SprintTemplate; error?: string }>;
      getAppInfo: () => Promise<{ name: string; version: string; platform: string }>;
      onMenuAction: (callback: (action: string) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}