import { app, BrowserWindow, ipcMain, Menu, nativeImage } from 'electron';
import * as path from 'path';
import { FileOperations } from './utils/fileOperations';

class CapacitatorApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    // Set app name for dock tooltip
    app.setName('Capacitator');

    // Handle app ready event
    app.whenReady().then(() => {
      this.setDockIcon();
      this.createMainWindow();
      this.setupMenu();
      this.setupIpcHandlers();
    });

    // Handle window closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Handle app activation (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  private setDockIcon(): void {
    // Set dock icon for macOS
    if (process.platform === 'darwin' && app.dock) {
      const iconPaths = [
        path.join(__dirname, '..', 'favicon.ico'),
        path.join(__dirname, 'assets', 'icon.ico')
      ];

      for (const iconPath of iconPaths) {
        if (!require('fs').existsSync(iconPath)) {
          continue;
        }

        try {
          const icon = nativeImage.createFromPath(iconPath);
          if (!icon.isEmpty()) {
            const resized = icon.resize({ width: 512, height: 512 });
            app.dock.setIcon(resized);
            return;
          }
        } catch (error) {
          continue;
        }
      }
    }
  }

  private createMainWindow(): void {
    const iconPath = path.join(__dirname, 'assets', 'icon.ico');

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: iconPath,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      title: 'Capacitator - Sprint Planning Calculator',
      show: false
    });

    // Load the renderer HTML
    this.mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Template',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-template');
            }
          },
          {
            label: 'Save Template',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow?.webContents.send('menu-save-template');
            }
          },
          {
            label: 'Load Template',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu-load-template');
            }
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About Capacitator',
            click: () => {
              this.mainWindow?.webContents.send('menu-about');
            }
          },
          {
            label: 'GitHub Repository',
            click: async () => {
              const { shell } = require('electron');
              await shell.openExternal('https://github.com/omaciel/capacitator');
            }
          }
        ]
      }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // Handle save template request
    ipcMain.handle('save-template', async (event, template) => {
      try {
        await FileOperations.saveTemplate(template);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Handle load template request
    ipcMain.handle('load-template', async () => {
      try {
        const template = await FileOperations.loadTemplate();
        return { success: true, template };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Handle get app info
    ipcMain.handle('get-app-info', () => {
      return {
        name: app.getName(),
        version: app.getVersion(),
        platform: process.platform
      };
    });
  }
}

// Initialize the application
new CapacitatorApp();