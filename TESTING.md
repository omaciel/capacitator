# Testing the Electron TypeScript Application

## Issues Fixed

The following issues have been addressed in the latest version:

### 1. Date Change Calculations
- **Issue**: Sprint start/end date changes didn't trigger recalculations
- **Fix**: Added proper event listeners with console logging for debugging
- **Test**: Change sprint start or end dates - "Total Days" should update automatically

### 2. Button Functionality
- **Issue**: Add Member, Save Template, Load Template buttons not working
- **Fix**: Reorganized code to work in browser context, proper event binding
- **Test**: All buttons should now work as expected

### 3. Module Loading
- **Issue**: TypeScript modules not loading properly in renderer
- **Fix**: Consolidated all code into single renderer file with inline utilities
- **Result**: All functionality now works without module import issues

## How to Test

1. **Build and Run**:
   ```bash
   npm run build
   npm start
   ```

2. **Test Date Calculations**:
   - Application starts with today's date as sprint start
   - Sprint end is set to 2 weeks from today
   - Change either date - "Total Days" should update automatically
   - Console shows debug logs for date changes

3. **Test Team Member Management**:
   - Click "Add Member" button - new row should appear
   - Enter team member details (name, available days, PTO)
   - Available days less than 5 will highlight the row in red
   - Story point capacity updates automatically based on team member availability

4. **Test File Operations**:
   - Click "Save Template" - native file dialog should appear
   - Save a JSON template with your team configuration
   - Click "Load Template" - file dialog should allow loading the saved template
   - Loaded template should populate all fields and team members

5. **Test Calculations**:
   - All calculations should update in real-time
   - Team capacity percentage, target story points, individual member capacity
   - Values should be consistent with original web application logic

## Debug Features

- Console logging for major events (date changes, button clicks, calculations)
- Error handling for file operations
- Modal dialogs for success/error feedback

## Platform Features

- Native file dialogs (save/load)
- Application menu with keyboard shortcuts
- Cross-platform compatibility
- Offline operation (no internet required)