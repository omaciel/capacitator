# Capacitator - Sprint Planning Calculator

A comprehensive sprint planning tool available as both a web application and cross-platform desktop application. Helps Agile teams calculate their sprint capacity based on team members' availability, velocity, and reserved capacity.

The name **Capacitator** is a fun nod to capacity and "Back to the Future's" flux capacitor.

## 🚀 Available Versions

### 🌐 Web Application (HTML Branch)
Simple, browser-based version that runs anywhere without installation.

### 🖥️ Desktop Application (TypeScript Branch)
Full-featured Electron desktop app with native file operations and enhanced UI.

## Features

### Sprint Planning
- **Team Velocity**: Enter your team's average velocity in story points from previous sprints
- **Sprint Dates**: Set sprint start and end dates (automatically calculates working days excluding weekends)
- **Reserved Capacity**: Set percentage of time reserved for non-sprint activities (meetings, support, etc.)
- **Real-time Calculations**: All values update automatically as you make changes

### Team Management
- **Add/Edit/Delete Team Members**: Manage team members with their available days and PTO information
- **Story Point Distribution**: Automatically calculates each member's story point capacity proportional to their availability
- **Low Availability Highlighting**: Visual indicators for team members with less than 5 available days
- **Individual Capacity**: Distributes total story points fairly based on each member's availability

### Template Management
- **Save Templates**: Export your team configuration for reuse across sprints
- **Load Templates**: Import previously saved team configurations
- **JSON Format**: Human-readable template files for easy sharing

### Desktop-Only Features
- **Native File Dialogs**: System-native save/load dialogs
- **Menu Bar Integration**: File operations accessible via application menu
- **Keyboard Shortcuts**: Ctrl/Cmd+S to save, Ctrl/Cmd+O to load, Ctrl/Cmd+N for new template
- **Offline Operation**: No internet connection required
- **Cross-platform**: Works on Windows, macOS, and Linux

## How It Works

### Sprint Capacity Calculation

1. **Sprint Duration**: Calculates working days between start and end dates (excludes weekends)
2. **Team Capacity**: Calculates team capacity as percentage of total possible days
3. **Target Calculation**: Applies reserved capacity reduction to determine realistic story point target
4. **Individual Distribution**: Distributes story points to each team member proportional to their availability

### Calculation Formula

```
Sprint Target = Team Velocity × (Team Capacity × (1 - Reserved Capacity))
```

Where:
- **Team Capacity** = (Total Team Available Days) / (Team Size × Sprint Days)
- **Reserved Capacity** = Percentage (e.g., 10% = 0.10)

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ (for desktop version)
- Git
- Modern web browser (for web version)

### Setup & Installation

```bash
# Clone the repository
git clone https://github.com/omaciel/capacitator.git
cd capacitator

# Quick setup with Makefile
make setup

# Or manual setup
npm install
```

### Running the Application

```bash
# Desktop Application
make run

# Development mode with hot reload
make dev

# Build for distribution
make build
```

### Web Version

```bash
# Switch to HTML branch for web version
git checkout html

# Open index.html in your browser
open index.html
```

## 📁 Project Structure

```
capacitator/
├── Makefile                 # Build automation and common tasks
├── package.json             # Node.js dependencies and scripts
├── src/                     # TypeScript source code
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Secure IPC bridge
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── utils/
│   │   ├── calculations.ts  # Sprint calculation logic
│   │   └── fileOperations.ts # File operations
│   └── renderer/
│       ├── index.html       # Application UI
│       ├── styles.css       # Modern CSS styling
│       ├── renderer.ts      # TypeScript renderer
│       └── renderer-browser.js # Browser-compatible JavaScript
├── dist/                    # Compiled application (generated)
├── release/                 # Distribution packages (generated)
└── index.html              # Web version (html branch)
```

## 💻 Technology Stack

### Desktop Application
- **Electron**: Cross-platform desktop framework
- **TypeScript**: Type-safe JavaScript development
- **Modern CSS**: Pure CSS with modern features (no external frameworks)
- **Minimal Dependencies**: Essential packages only for security and performance

### Web Application
- **Pure HTML/CSS/JavaScript**: No frameworks or dependencies
- **Bootstrap**: UI components and responsive design
- **Local Storage**: Browser-based data persistence

## 📋 Makefile Commands

```bash
make help           # Show available commands
make setup          # Initial project setup
make install        # Install dependencies
make build          # Build the application
make run            # Build and run desktop app
make dev            # Development mode with hot reload
make test           # Run tests
make clean          # Clean build artifacts
make dist           # Create distribution packages
make pack           # Create portable packages
```

## 🔧 Available Scripts

### Desktop Application

```bash
# Development
npm run build       # Build TypeScript
npm run watch       # Watch mode for development
npm start          # Build and start application
npm run dev        # Development with auto-reload

# Distribution
npm run pack       # Package without installer
npm run dist       # Create installer packages
npm run clean      # Clean build artifacts
```

## 🏗️ Build Outputs

- **Development**: `npm run dev` - Hot reload for development
- **Production**: `npm run dist` - Creates installer packages
- **Portable**: `npm run pack` - Creates portable app without installer

## ⌨️ Keyboard Shortcuts (Desktop)

- `Ctrl/Cmd + N`: New template
- `Ctrl/Cmd + S`: Save template
- `Ctrl/Cmd + O`: Load template
- `Ctrl/Cmd + Q`: Quit application (macOS)
- `F12`: Toggle Developer Tools

## 🖥️ Platform Support

- **Windows**: NSIS installer (.exe)
- **macOS**: DMG installer (.dmg)
- **Linux**: AppImage (.AppImage)
- **Web**: Any modern browser

## 🧪 Testing

```bash
# Run all tests
make test

# Test specific functionality
npm run build && open test.html
```

## 📚 Documentation

- **TESTING.md**: Comprehensive testing guide and troubleshooting
- **Web Version**: Available in `html` branch
- **Desktop Version**: Available in `typescript` branch

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test across platforms (use `make test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- **Web Version**: Keep it simple, no dependencies
- **Desktop Version**: Maintain type safety with TypeScript
- **Cross-platform**: Test on multiple operating systems
- **Security**: Follow Electron security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original web-based calculator concept
- [Electron](https://electronjs.org/) for cross-platform desktop development
- [TypeScript](https://typescriptlang.org/) for type-safe development
- The Agile and Scrum community for sprint planning methodologies

## 📊 Example Usage

1. **Set Sprint Details**: Define team velocity (e.g., 88 story points) and sprint dates
2. **Add Team Members**: Include each member's availability (e.g., 10 days for full-time, 8 days with PTO)
3. **Set Reserved Capacity**: Account for meetings and non-sprint work (typically 10-20%)
4. **Review Results**: See calculated story point distribution per team member
5. **Save Template**: Store configuration for future sprints