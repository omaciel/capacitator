# Capacitator - Electron TypeScript Desktop Application

A cross-platform desktop application built with Electron and TypeScript that helps Agile teams calculate their sprint capacity based on team members' availability, velocity, and reserved capacity.

## Features

### Sprint Planning
- **Team Velocity**: Enter your team's average velocity in story points from previous sprints
- **Sprint Dates**: Set sprint start and end dates (automatically calculates working days excluding weekends)
- **Reserved Capacity**: Set percentage of time reserved for non-sprint activities

### Team Management
- **Add/Edit/Delete Team Members**: Manage team members with their available days and PTO information
- **Story Point Distribution**: Automatically calculates each member's story point capacity proportional to their availability
- **Low Availability Highlighting**: Visual indicators for team members with less than 5 available days

### Template Management
- **Save Templates**: Export your team configuration as JSON for reuse across sprints
- **Load Templates**: Import previously saved team configurations
- **Keyboard Shortcuts**: Ctrl/Cmd+S to save, Ctrl/Cmd+O to load, Ctrl/Cmd+N for new template

### Desktop Features
- **Native File Dialogs**: System-native save/load dialogs
- **Menu Bar Integration**: File operations accessible via application menu
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Offline Operation**: No internet connection required

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the application
npm start
```

### Development
```bash
# Start in development mode (with auto-reload)
npm run dev
```

### Building for Distribution
```bash
# Build for current platform
npm run dist

# Package without installer
npm run pack
```

## Project Structure

```
src/
├── main.ts              # Electron main process
├── preload.ts           # Preload script for secure IPC
├── types/
│   └── index.ts         # TypeScript type definitions
├── utils/
│   ├── calculations.ts  # Sprint calculation logic
│   └── fileOperations.ts # File save/load operations
└── renderer/
    ├── index.html       # Application UI
    ├── styles.css       # Modern CSS styling
    └── renderer.ts      # Renderer process logic
```

## Technology Stack

- **Electron**: Cross-platform desktop framework
- **TypeScript**: Type-safe JavaScript development
- **Modern CSS**: No external UI frameworks - pure CSS with modern features
- **Minimal Dependencies**: Only essential packages for security and performance

## Key Differences from Web Version

1. **Native File Operations**: Uses system file dialogs instead of browser downloads
2. **Menu Integration**: File operations accessible via native application menu
3. **Desktop UI**: Optimized for desktop with proper window management
4. **Offline First**: No external dependencies or CDNs
5. **Type Safety**: Full TypeScript implementation with proper type checking

## Build Outputs

- **Development**: `npm run dev` - Hot reload for development
- **Production**: `npm run dist` - Creates installer packages
- **Portable**: `npm run pack` - Creates portable app without installer

## Keyboard Shortcuts

- `Ctrl/Cmd + N`: New template
- `Ctrl/Cmd + S`: Save template
- `Ctrl/Cmd + O`: Load template
- `Ctrl/Cmd + Q`: Quit application (macOS)
- `F12`: Toggle Developer Tools

## Platform Support

- **Windows**: NSIS installer (.exe)
- **macOS**: DMG installer (.dmg)
- **Linux**: AppImage (.AppImage)

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test across platforms
5. Submit a pull request