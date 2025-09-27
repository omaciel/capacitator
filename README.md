# Capacitator - Sprint Planning Calculator

A desktop application built with Go and Fyne that helps Agile teams calculate their sprint capacity based on team members' availability, velocity, and reserved capacity.

## Features

### Sprint Details
- **Team Velocity**: Enter your team's average velocity in story points from previous sprints
- **Sprint Dates**: Set sprint start and end dates (automatically calculates working days excluding weekends)
- **Reserved Capacity**: Set percentage of time reserved for non-sprint activities (meetings, support, etc.)

### Team Details (Auto-calculated)
- **Team Size**: Total number of team members
- **Total Team Days**: Sum of all team members' available days
- **Sprint Capacity**: Percentage of full capacity based on available days
- **Sprint Target**: Target story points for the sprint based on velocity and capacity

### Team Management
- **Add Team Members**: Add team members with their available days and PTO information
- **Edit Members**: Click on team member details to edit name, available days, or PTO dates
- **Delete Members**: Remove team members from the calculation
- **Story Point Distribution**: Automatically calculates each member's story point capacity proportional to their availability

### Template Management
- **Save Templates**: Export your team configuration as JSON for reuse
- **Load Templates**: Import previously saved team configurations

## How It Works

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

## Installation

### Prerequisites
- Go 1.24.5 or later
- Git

### Build from Source

```bash
git clone https://github.com/omaciel/capacitator.git
cd capacitator
go mod tidy
go build -o capacitator main.go
./capacitator
```

### Quick Run (without building)

```bash
# Run directly with Go
go run main.go
```

### Using Makefile

```bash
# Build and run
make run

# Just build
make build

# Clean build artifacts
make clean

# Install dependencies
make deps
```

### Dependencies
- [Fyne v2](https://fyne.io/) - Cross-platform GUI toolkit for Go

## Usage

1. **Set Sprint Details**:
   - Enter your team's historical velocity
   - Set sprint start and end dates
   - Adjust reserved capacity percentage (default: 10%)

2. **Add Team Members**:
   - Click "Add Member" to add team members
   - Enter their name and available days for the sprint
   - Optionally add PTO dates for reference

3. **Review Calculations**:
   - Check the calculated sprint target
   - Review individual story point distributions
   - Adjust team member availability as needed

4. **Save/Load Templates**:
   - Save your team configuration for future sprints
   - Load previously saved configurations

## Features Matching Original Web Version

This Fyne application replicates all functionality from the original web-based calculator:

- ✅ Sprint details form with validation
- ✅ Real-time calculations
- ✅ Team member management
- ✅ Story point capacity distribution
- ✅ Weekend exclusion in date calculations
- ✅ Template save/load functionality
- ✅ Input validation and error handling
- ✅ Responsive layout

## File Structure

```
capacitator/
├── main.go          # Main application code
├── go.mod           # Go module definition
├── README.md        # This file
├── index.html       # Original web version (reference)
└── capacitator      # Compiled executable (after build)
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original web-based calculator concept
- [Fyne](https://fyne.io/) for the excellent Go GUI framework
- The Agile and Scrum community for sprint planning methodologies