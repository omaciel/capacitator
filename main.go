package main

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/data/binding"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/storage"
	"fyne.io/fyne/v2/widget"
)

// TeamMember represents a team member with their availability
type TeamMember struct {
	Name          string  `json:"name"`
	AvailableDays float64 `json:"availableDays"`
	PTODates      string  `json:"ptoDates"`
	StoryPoints   int     `json:"storyPoints"`
}

// SprintTemplate represents the complete sprint configuration
type SprintTemplate struct {
	TeamVelocity     float64      `json:"teamVelocity"`
	SprintStarts     string       `json:"sprintStarts"`
	SprintEnds       string       `json:"sprintEnds"`
	ReservedCapacity float64      `json:"reservedCapacity"`
	TeamMembers      []TeamMember `json:"teamMembers"`
}

// SprintCalculator holds all the application state and UI components
type SprintCalculator struct {
	app    fyne.App
	window fyne.Window

	// Sprint Details inputs
	teamVelocityEntry     *widget.Entry
	sprintStartsEntry     *widget.Entry
	sprintEndsEntry       *widget.Entry
	reservedCapacityEntry *widget.Entry

	// Action buttons
	addBtn  *widget.Button
	saveBtn *widget.Button
	loadBtn *widget.Button

	// Team Details displays
	teamSizeLabel       *widget.Label
	totalTeamDaysLabel  *widget.Label
	sprintCapacityLabel *widget.Label
	sprintTargetLabel   *widget.Label
	totalDaysLabel      *widget.Label

	// Team members data
	teamMembers []TeamMember
	teamTable   *widget.Table

	// Help/status system
	statusLabel *widget.Label

	// Data bindings
	teamVelocityData     binding.Float
	reservedCapacityData binding.Float
}

func main() {
	myApp := app.New()

	calculator := NewSprintCalculator(myApp)
	calculator.setupUI()
	calculator.setDefaultValues()

	calculator.window.ShowAndRun()
}

func NewSprintCalculator(app fyne.App) *SprintCalculator {
	sc := &SprintCalculator{
		app:    app,
		window: app.NewWindow("Sprint Planning Calculator"),
	}

	sc.teamVelocityData = binding.NewFloat()
	sc.reservedCapacityData = binding.NewFloat()

	return sc
}

func (sc *SprintCalculator) setupUI() {
	// Calculate window width based on Team Members table width
	// Table column widths: 200 + 150 + 180 + 120 + 100 = 750
	tableWidth := float32(200 + 150 + 180 + 120 + 100)       // Total table columns width
	tablePadding := float32(40)                              // Card padding around table
	windowPadding := float32(40)                             // Window padding
	windowWidth := tableWidth + tablePadding + windowPadding // Total required width
	windowHeight := float32(800)

	sc.window.Resize(fyne.NewSize(windowWidth, windowHeight))

	// Create action buttons
	sc.addBtn = widget.NewButton("Add Member", func() {
		sc.addTeamMemberDialog()
	})

	sc.saveBtn = widget.NewButton("Save Template", func() {
		sc.saveTemplate()
	})

	sc.loadBtn = widget.NewButton("Load Template", func() {
		sc.loadTemplate()
	})

	// Create main container
	title := widget.NewCard("", "", widget.NewLabelWithStyle(
		"Sprint Planning Calculator",
		fyne.TextAlignCenter,
		fyne.TextStyle{Bold: true},
	))

	// Create sprint details section
	sprintDetails := sc.createSprintDetailsSection()

	// Create team details section
	teamDetails := sc.createTeamDetailsSection()

	// Create team members table
	teamMembersSection := sc.createTeamMembersSection()

	// Create footer
	footer := sc.createFooter()

	// Create status bar for help/tooltip information
	sc.statusLabel = widget.NewLabel("Ready - Hover over fields for help")
	sc.statusLabel.Wrapping = fyne.TextWrapWord
	statusBar := container.NewBorder(nil, nil,
		widget.NewLabel("💡"), nil,
		sc.statusLabel,
	)

	// Create action buttons section
	actionButtons := sc.createActionButtonsSection()

	// Create proportional layout 50%-30%-20% while preserving widget.Cards
	// Use manual positioning with calculated widths
	topSection := container.NewWithoutLayout(
		sprintDetails, // Sprint Details Card
		teamDetails,   // Team Details Card
		actionButtons, // Actions Card
	)

	// Calculate positions and sizes for 50%-30%-20% layout
	totalWidth := windowWidth - windowPadding
	cardHeight := float32(250)

	// Sprint Details: 50% width, positioned at x=0
	sprintDetails.Resize(fyne.NewSize(totalWidth*0.50, cardHeight))
	sprintDetails.Move(fyne.NewPos(0, 0))

	// Team Details: 30% width, positioned after Sprint Details
	teamDetails.Resize(fyne.NewSize(totalWidth*0.30, cardHeight))
	teamDetails.Move(fyne.NewPos(totalWidth*0.50, 0))

	// Actions: 20% width, positioned at the end
	actionButtons.Resize(fyne.NewSize(totalWidth*0.20, cardHeight))
	actionButtons.Move(fyne.NewPos(totalWidth*0.80, 0))

	// Bottom row: Team members section spanning full width
	bottomSection := container.NewGridWithColumns(1,
		teamMembersSection, // Team Members - spans full width
	)

	// Create main content area with equal height distribution
	mainContent := container.NewGridWithRows(2,
		topSection,    // Top row - 3 sections
		bottomSection, // Bottom row - team members
	)

	// Use border layout with title at top and status/footer at bottom
	content := container.NewBorder(
		title,                                // top - title
		container.NewVBox(statusBar, footer), // bottom - status bar + footer
		nil,                                  // left
		nil,                                  // right
		mainContent,                          // center - 2x3 grid
	)

	sc.window.SetContent(container.NewScroll(content))
}

func (sc *SprintCalculator) createSprintDetailsSection() *widget.Card {
	sc.teamVelocityEntry = widget.NewEntry()
	sc.teamVelocityEntry.SetText("88")
	sc.teamVelocityEntry.OnChanged = func(string) { sc.calculateAll() }

	// Create date entry with calendar button - ensure adequate sizing
	sc.sprintStartsEntry = widget.NewEntry()
	sc.sprintStartsEntry.OnChanged = func(string) { sc.calculateAll() }
	startDateContainer := container.NewBorder(nil, nil, nil,
		widget.NewButton("📅", func() { sc.showDatePicker(sc.sprintStartsEntry, "Select Sprint Start Date") }),
		sc.sprintStartsEntry)
	startDateContainer.Resize(fyne.NewSize(200, 40)) // Ensure minimum width

	sc.sprintEndsEntry = widget.NewEntry()
	sc.sprintEndsEntry.OnChanged = func(string) { sc.calculateAll() }
	endDateContainer := container.NewBorder(nil, nil, nil,
		widget.NewButton("📅", func() { sc.showDatePicker(sc.sprintEndsEntry, "Select Sprint End Date") }),
		sc.sprintEndsEntry)
	endDateContainer.Resize(fyne.NewSize(200, 40)) // Ensure minimum width

	sc.totalDaysLabel = widget.NewLabel("0")

	sc.reservedCapacityEntry = widget.NewEntry()
	sc.reservedCapacityEntry.SetText("10")
	sc.reservedCapacityEntry.OnChanged = func(string) { sc.calculateAll() }

	form := &widget.Form{
		Items: []*widget.FormItem{
			{Text: "Team Velocity:", Widget: sc.teamVelocityEntry},
			{Text: "Sprint Starts:", Widget: startDateContainer},
			{Text: "Sprint Ends:", Widget: endDateContainer},
			{Text: "Total Days:", Widget: sc.totalDaysLabel},
			{Text: "Reserved Capacity (%):", Widget: sc.reservedCapacityEntry},
		},
	}

	return widget.NewCard("Sprint Details", "", form)
}

func (sc *SprintCalculator) createTeamDetailsSection() *widget.Card {
	sc.teamSizeLabel = widget.NewLabel("0")
	sc.totalTeamDaysLabel = widget.NewLabel("0")
	sc.sprintCapacityLabel = widget.NewLabel("0")
	sc.sprintTargetLabel = widget.NewLabel("0")

	form := &widget.Form{
		Items: []*widget.FormItem{
			{Text: "Team Size:", Widget: sc.teamSizeLabel},
			{Text: "Total Team Days:", Widget: sc.totalTeamDaysLabel},
			{Text: "Sprint Capacity (%):", Widget: sc.sprintCapacityLabel},
			{Text: "Sprint Target:", Widget: sc.sprintTargetLabel},
		},
	}

	return widget.NewCard("Team Details", "", form)
}

func (sc *SprintCalculator) createActionButtonsSection() *widget.Card {
	// Create help button
	helpBtn := widget.NewButton("❓ Help", func() {
		sc.showHelpDialog()
	})

	// Create container for all action buttons (stacked vertically)
	buttonContainer := container.NewVBox(
		sc.addBtn,
		sc.saveBtn,
		sc.loadBtn,
		helpBtn,
	)

	return widget.NewCard("Actions", "", buttonContainer)
}

func (sc *SprintCalculator) createTeamMembersSection() *widget.Card {
	// Create table
	sc.teamTable = widget.NewTable(
		func() (int, int) {
			return len(sc.teamMembers) + 1, 5 // +1 for header row
		},
		func() fyne.CanvasObject {
			return widget.NewButton("Template", nil)
		},
		func(id widget.TableCellID, cell fyne.CanvasObject) {
			if id.Row == 0 {
				// Header row - use label
				button := cell.(*widget.Button)
				headers := []string{"Team Member", "Available Days", "PTO Dates", "Story Points", "Actions"}
				if id.Col < len(headers) {
					button.SetText(headers[id.Col])
					button.OnTapped = nil // Disable clicking on headers
				}
			} else if id.Row-1 < len(sc.teamMembers) {
				// Data rows
				member := sc.teamMembers[id.Row-1]
				button := cell.(*widget.Button)

				switch id.Col {
				case 0:
					button.SetText(member.Name)
					button.OnTapped = func() { sc.editTeamMember(id.Row-1, 0) }
				case 1:
					button.SetText(fmt.Sprintf("%.1f", member.AvailableDays))
					button.OnTapped = func() { sc.editTeamMember(id.Row-1, 1) }
				case 2:
					button.SetText(member.PTODates)
					button.OnTapped = func() { sc.editTeamMember(id.Row-1, 2) }
				case 3:
					button.SetText(fmt.Sprintf("%d", member.StoryPoints))
					button.OnTapped = nil // Story points are calculated, not editable
				case 4:
					// Delete button
					memberIndex := id.Row - 1
					button.SetText("🗑️ Delete")
					button.OnTapped = func() {
						sc.deleteTeamMember(memberIndex)
					}
				}
			}
		},
	)

	// Set column widths for better spacing
	sc.teamTable.SetColumnWidth(0, 200) // Team Member
	sc.teamTable.SetColumnWidth(1, 150) // Available Days
	sc.teamTable.SetColumnWidth(2, 180) // PTO Dates
	sc.teamTable.SetColumnWidth(3, 120) // Story Points
	sc.teamTable.SetColumnWidth(4, 100) // Actions

	// Table interactions are now handled by button OnTapped events

	// Create a larger container for the table with padding
	tableContainer := container.NewPadded(sc.teamTable)

	return widget.NewCard("Team Members", "", tableContainer)
}

func (sc *SprintCalculator) createFooter() *fyne.Container {
	footerLabel := widget.NewRichTextFromMarkdown(`
### Powered By [Capacitator](https://github.com/omaciel/capacitator)
`)
	footerLabel.Wrapping = fyne.TextWrapWord

	return container.NewCenter(footerLabel)
}

func (sc *SprintCalculator) setDefaultValues() {
	// Set default dates
	today := time.Now()
	sc.sprintStartsEntry.SetText(today.Format("2006-01-02"))

	twoWeeksLater := today.AddDate(0, 0, 14)
	sc.sprintEndsEntry.SetText(twoWeeksLater.Format("2006-01-02"))

	sc.calculateAll()
}

func (sc *SprintCalculator) calculateAll() {
	sc.calculateSprintDays()
	sc.updateTeamSize()
	sc.calculateTotalTeamDays()
	sc.calculateTotalTeamCapacity()
	sc.calculateTargetStoryPoints()
	sc.updateTeamMembersStoryPointCapacity()
}

func (sc *SprintCalculator) calculateSprintDays() {
	startStr := sc.sprintStartsEntry.Text
	endStr := sc.sprintEndsEntry.Text

	startDate, err1 := time.Parse("2006-01-02", startStr)
	endDate, err2 := time.Parse("2006-01-02", endStr)

	if err1 != nil || err2 != nil || endDate.Before(startDate) {
		sc.totalDaysLabel.SetText("Invalid dates")
		return
	}

	workingDays := 0
	currentDate := startDate

	for currentDate.Before(endDate) {
		// Monday = 1, Sunday = 0
		if currentDate.Weekday() != time.Saturday && currentDate.Weekday() != time.Sunday {
			workingDays++
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	sc.totalDaysLabel.SetText(fmt.Sprintf("%d", workingDays))
}

func (sc *SprintCalculator) updateTeamSize() {
	sc.teamSizeLabel.SetText(fmt.Sprintf("%d", len(sc.teamMembers)))
}

func (sc *SprintCalculator) calculateTotalTeamDays() {
	totalDays := 0.0
	for _, member := range sc.teamMembers {
		totalDays += member.AvailableDays
	}
	sc.totalTeamDaysLabel.SetText(fmt.Sprintf("%.1f", totalDays))
}

func (sc *SprintCalculator) calculateTotalTeamCapacity() {
	totalTeamDays, _ := strconv.ParseFloat(sc.totalTeamDaysLabel.Text, 64)
	teamSize := len(sc.teamMembers)
	totalSprintDays, _ := strconv.Atoi(sc.totalDaysLabel.Text)

	if teamSize > 0 && totalSprintDays > 0 {
		capacity := (totalTeamDays / (float64(teamSize) * float64(totalSprintDays))) * 100
		sc.sprintCapacityLabel.SetText(fmt.Sprintf("%.2f", capacity))
	} else {
		sc.sprintCapacityLabel.SetText("0")
	}
}

func (sc *SprintCalculator) calculateTargetStoryPoints() {
	teamVelocity, _ := strconv.ParseFloat(sc.teamVelocityEntry.Text, 64)
	totalTeamCapacity, _ := strconv.ParseFloat(sc.sprintCapacityLabel.Text, 64)
	reservedCapacity, _ := strconv.ParseFloat(sc.reservedCapacityEntry.Text, 64)

	reservedFraction := reservedCapacity / 100
	adjustedCapacity := totalTeamCapacity * (1 - reservedFraction)
	targetStoryPoints := math.Round((adjustedCapacity / 100) * teamVelocity)

	sc.sprintTargetLabel.SetText(fmt.Sprintf("%.0f", targetStoryPoints))
}

func (sc *SprintCalculator) updateTeamMembersStoryPointCapacity() {
	totalTeamDays, _ := strconv.ParseFloat(sc.totalTeamDaysLabel.Text, 64)
	targetStoryPoints, _ := strconv.ParseFloat(sc.sprintTargetLabel.Text, 64)

	if totalTeamDays <= 0 {
		return
	}

	totalAssigned := 0
	for i := range sc.teamMembers {
		capacity := math.Round(sc.teamMembers[i].AvailableDays / totalTeamDays * targetStoryPoints)
		sc.teamMembers[i].StoryPoints = int(capacity)
		totalAssigned += int(capacity)
	}

	// Adjust rounding errors by giving difference to a random team member
	if len(sc.teamMembers) > 0 && totalAssigned != int(targetStoryPoints) {
		diff := int(targetStoryPoints) - totalAssigned
		randomIndex := rand.Intn(len(sc.teamMembers))
		sc.teamMembers[randomIndex].StoryPoints += diff
	}

	sc.teamTable.Refresh()
}

func (sc *SprintCalculator) addTeamMemberDialog() {
	nameEntry := widget.NewEntry()
	nameEntry.SetPlaceHolder("Enter team member name")

	totalDays, _ := strconv.Atoi(sc.totalDaysLabel.Text)
	daysEntry := widget.NewEntry()
	daysEntry.SetText(fmt.Sprintf("%d", totalDays))

	ptoEntry := widget.NewEntry()
	ptoEntry.SetPlaceHolder("PTO dates (optional)")

	form := &widget.Form{
		Items: []*widget.FormItem{
			{Text: "Name:", Widget: nameEntry},
			{Text: "Available Days:", Widget: daysEntry},
			{Text: "PTO Dates:", Widget: ptoEntry},
		},
	}

	dialog.ShowForm("Add Team Member", "Add", "Cancel", form.Items, func(confirmed bool) {
		if confirmed && nameEntry.Text != "" {
			days, err := strconv.ParseFloat(daysEntry.Text, 64)
			if err != nil {
				days = 0
			}

			member := TeamMember{
				Name:          nameEntry.Text,
				AvailableDays: days,
				PTODates:      ptoEntry.Text,
				StoryPoints:   0,
			}

			sc.teamMembers = append(sc.teamMembers, member)
			sc.calculateAll()
			sc.teamTable.Refresh()
		}
	}, sc.window)
}

func (sc *SprintCalculator) editTeamMember(index, col int) {
	if index >= len(sc.teamMembers) {
		return
	}

	member := &sc.teamMembers[index]
	var entry *widget.Entry
	var title string

	switch col {
	case 0:
		title = "Edit Team Member Name"
		entry = widget.NewEntry()
		entry.SetText(member.Name)
	case 1:
		title = "Edit Available Days"
		entry = widget.NewEntry()
		entry.SetText(fmt.Sprintf("%.1f", member.AvailableDays))
	case 2:
		title = "Edit PTO Dates"
		entry = widget.NewEntry()
		entry.SetText(member.PTODates)
	default:
		return
	}

	dialog.ShowForm(title, "Save", "Cancel", []*widget.FormItem{
		{Text: "Value:", Widget: entry},
	}, func(confirmed bool) {
		if confirmed {
			switch col {
			case 0:
				member.Name = entry.Text
			case 1:
				if days, err := strconv.ParseFloat(entry.Text, 64); err == nil {
					member.AvailableDays = days
				}
			case 2:
				member.PTODates = entry.Text
			}
			sc.calculateAll()
			sc.teamTable.Refresh()
		}
	}, sc.window)
}

func (sc *SprintCalculator) deleteTeamMember(index int) {
	if index >= 0 && index < len(sc.teamMembers) {
		sc.teamMembers = append(sc.teamMembers[:index], sc.teamMembers[index+1:]...)
		sc.calculateAll()
		sc.teamTable.Refresh()
	}
}

func (sc *SprintCalculator) saveTemplate() {
	template := SprintTemplate{
		TeamVelocity:     parseFloat(sc.teamVelocityEntry.Text),
		SprintStarts:     sc.sprintStartsEntry.Text,
		SprintEnds:       sc.sprintEndsEntry.Text,
		ReservedCapacity: parseFloat(sc.reservedCapacityEntry.Text),
		TeamMembers:      sc.teamMembers,
	}

	jsonData, err := json.MarshalIndent(template, "", "  ")
	if err != nil {
		dialog.ShowError(err, sc.window)
		return
	}

	saveDialog := dialog.NewFileSave(func(writer fyne.URIWriteCloser, err error) {
		if err != nil {
			dialog.ShowError(err, sc.window)
			return
		}
		if writer == nil {
			return
		}
		defer writer.Close()

		_, err = writer.Write(jsonData)
		if err != nil {
			dialog.ShowError(err, sc.window)
			return
		}

		dialog.ShowInformation("Success", "Template saved successfully!", sc.window)
	}, sc.window)

	saveDialog.SetFileName("sprint_template.json")
	saveDialog.SetFilter(storage.NewExtensionFileFilter([]string{".json"}))
	saveDialog.Show()
}

func (sc *SprintCalculator) loadTemplate() {
	openDialog := dialog.NewFileOpen(func(reader fyne.URIReadCloser, err error) {
		if err != nil {
			dialog.ShowError(err, sc.window)
			return
		}
		if reader == nil {
			return
		}
		defer reader.Close()

		data := make([]byte, 1024*1024) // 1MB max
		n, err := reader.Read(data)
		if err != nil && n == 0 {
			dialog.ShowError(err, sc.window)
			return
		}

		var template SprintTemplate
		if err := json.Unmarshal(data[:n], &template); err != nil {
			dialog.ShowError(fmt.Errorf("invalid JSON format: %v", err), sc.window)
			return
		}

		// Load the template data
		sc.teamVelocityEntry.SetText(fmt.Sprintf("%.0f", template.TeamVelocity))
		sc.sprintStartsEntry.SetText(template.SprintStarts)
		sc.sprintEndsEntry.SetText(template.SprintEnds)
		sc.reservedCapacityEntry.SetText(fmt.Sprintf("%.0f", template.ReservedCapacity))

		sc.teamMembers = template.TeamMembers
		sc.calculateAll()
		sc.teamTable.Refresh()

		dialog.ShowInformation("Success", "Template loaded successfully!", sc.window)
	}, sc.window)

	openDialog.SetFilter(storage.NewExtensionFileFilter([]string{".json"}))
	openDialog.Show()
}

func (sc *SprintCalculator) showDatePicker(targetEntry *widget.Entry, title string) {
	now := time.Now()

	// Get current date from entry if valid, otherwise use today
	currentDate := now
	if targetEntry.Text != "" {
		if parsed, err := time.Parse("2006-01-02", targetEntry.Text); err == nil {
			currentDate = parsed
		}
	}

	// Create select widgets for year, month, day
	years := make([]string, 10)
	for i := 0; i < 10; i++ {
		years[i] = fmt.Sprintf("%d", now.Year()+i-2)
	}
	yearSelect := widget.NewSelect(years, nil)
	yearSelect.SetSelected(fmt.Sprintf("%d", currentDate.Year()))

	months := []string{
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December",
	}
	monthSelect := widget.NewSelect(months, nil)
	monthSelect.SetSelected(months[currentDate.Month()-1])

	// Generate days based on selected month/year
	days := make([]string, 31)
	for i := 1; i <= 31; i++ {
		days[i-1] = fmt.Sprintf("%d", i)
	}
	daySelect := widget.NewSelect(days, nil)
	daySelect.SetSelected(fmt.Sprintf("%d", currentDate.Day()))

	// Update days when month or year changes
	updateDays := func() {
		yearInt, _ := strconv.Atoi(yearSelect.Selected)
		monthInt := 0
		for i, month := range months {
			if month == monthSelect.Selected {
				monthInt = i + 1
				break
			}
		}

		if yearInt > 0 && monthInt > 0 {
			daysInMonth := time.Date(yearInt, time.Month(monthInt+1), 0, 0, 0, 0, 0, time.UTC).Day()
			newDays := make([]string, daysInMonth)
			for i := 1; i <= daysInMonth; i++ {
				newDays[i-1] = fmt.Sprintf("%d", i)
			}
			daySelect.Options = newDays
			daySelect.Refresh()

			// Adjust selected day if it's beyond the valid range
			if selectedDay, _ := strconv.Atoi(daySelect.Selected); selectedDay > daysInMonth {
				daySelect.SetSelected(fmt.Sprintf("%d", daysInMonth))
			}
		}
	}

	yearSelect.OnChanged = func(string) { updateDays() }
	monthSelect.OnChanged = func(string) { updateDays() }

	form := &widget.Form{
		Items: []*widget.FormItem{
			{Text: "Year:", Widget: yearSelect},
			{Text: "Month:", Widget: monthSelect},
			{Text: "Day:", Widget: daySelect},
		},
	}

	dialog.ShowForm(title, "Select", "Cancel", form.Items, func(confirmed bool) {
		if confirmed && yearSelect.Selected != "" && monthSelect.Selected != "" && daySelect.Selected != "" {
			year, _ := strconv.Atoi(yearSelect.Selected)
			monthInt := 0
			for i, month := range months {
				if month == monthSelect.Selected {
					monthInt = i + 1
					break
				}
			}
			day, _ := strconv.Atoi(daySelect.Selected)

			selectedDate := time.Date(year, time.Month(monthInt), day, 0, 0, 0, 0, time.UTC)
			targetEntry.SetText(selectedDate.Format("2006-01-02"))
		}
	}, sc.window)
}

func (sc *SprintCalculator) showHelpDialog() {
	// Calculate dialog size relative to window size (80% width, fixed height)
	windowSize := sc.window.Content().Size()
	dialogWidth := windowSize.Width * 0.80
	dialogHeight := float32(600)

	// Create properly formatted help text
	helpText := `Sprint Planning Calculator Help

SPRINT DETAILS:
  • Team Velocity: Average velocity in story points from previous sprints
  • Sprint Starts: Start date - click calendar to select
  • Sprint Ends: End date - click calendar to select
  • Total Days: Number of sprint days excluding weekends
  • Reserved Capacity: Percentage reserved for non-sprint activities

TEAM DETAILS:
  • Team Size: Total number of team members
  • Total Team Days: Total available team days during sprint
  • Sprint Capacity: Team capacity based on available days
  • Sprint Target: Target story points based on capacity

TEAM MEMBERS:
  • Click team member details to edit
  • Use Delete button to remove members
  • Story Points are calculated automatically based on availability

ACTIONS:
  • Add Member: Add new team member
  • Save Template: Export team configuration as JSON
  • Load Template: Import saved team configuration`

	helpContent := widget.NewLabel(helpText)

	helpContent.Wrapping = fyne.TextWrapWord

	scrollContainer := container.NewScroll(helpContent)

	// Create a properly sized container
	dialogContainer := container.NewPadded(scrollContainer)

	// Create and show the dialog with constrained size
	d := dialog.NewCustom("Help - Field Descriptions", "Close", dialogContainer, sc.window)
	d.Resize(fyne.NewSize(dialogWidth, dialogHeight))
	d.Show()
}

func parseFloat(s string) float64 {
	if s == "" {
		return 0
	}
	val, err := strconv.ParseFloat(strings.TrimSpace(s), 64)
	if err != nil {
		return 0
	}
	return val
}
