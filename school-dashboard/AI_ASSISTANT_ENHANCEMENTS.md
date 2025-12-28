# AI Assistant Function Calling & Voice Input Implementation

## Overview
Enhanced the AI Assistant with:
1. Groq function calling capabilities to perform actions like creating students and sending forms
2. Whisper speech-to-text for voice input

## Features Implemented

### 1. Voice Input (Whisper Integration)
- **Microphone Button**: Click to start/stop recording
- **Real-time Transcription**: Uses Groq's Whisper Large V3 Turbo model
- **Visual Feedback**: 
  - Recording indicator (red pulsing button)
  - Transcribing status
  - Success/error toasts
- **Auto-fill**: Transcribed text automatically fills the input field

#### How to Use Voice Input:
1. Click the microphone button 🎤
2. Speak your message
3. Click again to stop recording (or it auto-stops)
4. Wait for transcription
5. Review and edit if needed
6. Send message

### 2. Function Calling System
The AI can now execute real actions in the system:

#### Available Functions:
1. **create_student** - Create new students with mandatory details
   - Required: name, classId, gender, parentName, parentPhone
   - Optional: rollNo, dateOfBirth, academicYear

2. **send_form** - Send intake forms to staff or students
   - Required: formId, recipientId, recipientType (staff/student)
   - Optional: dueDate, notes

3. **get_classes** - Fetch all available classes
4. **get_forms** - Fetch all available intake forms
5. **get_staff** - Fetch all staff members
6. **get_students** - Fetch students (optionally filtered by class)

### 2. Enhanced AI Service (`aiService.js`)
- Added function definitions compatible with Groq's function calling API
- Implemented function execution logic
- Added two-step conversation flow:
  1. AI decides to call a function
  2. Function executes and result is sent back to AI
  3. AI generates human-friendly response

### 3. Updated AI Modal (`AiModal.jsx`)
- Shows loading indicator when function is executing
- Displays success/error toasts for function results
- Maintains conversation context across function calls

### 4. New Prompt Starters
Added quick action buttons:
- 👨‍🎓 Create Student
- 📝 Send Form

## Usage Examples

### Creating a Student
**User:** "Create a new student named John Doe in class 5-A"

**AI Flow:**
1. AI calls `get_classes()` to find class 5-A's ID
2. AI asks for missing mandatory info (gender, parent details)
3. User provides: "Male, parent is Jane Doe, phone 9876543210"
4. AI calls `create_student()` with all details
5. System creates student and returns success
6. AI confirms: "✅ Student John Doe created successfully in class 5-A!"

### Sending a Form
**User:** "Send the admission form to teacher Mr. Smith"

**AI Flow:**
1. AI calls `get_forms()` to find admission form ID
2. AI calls `get_staff()` to find Mr. Smith's ID
3. AI calls `send_form()` with form and recipient IDs
4. System sends form assignment
5. AI confirms: "✅ Admission form sent to Mr. Smith!"

## Technical Details

### Whisper API Integration
```javascript
// Transcription endpoint
const WHISPER_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// Model used
model: 'whisper-large-v3-turbo'

// Supported formats
- WebM (browser recording)
- MP3, WAV, M4A, etc.

// Features
- Language detection
- High accuracy
- Fast processing (~1-2 seconds)
```

### Audio Recording
- Uses browser's MediaRecorder API
- Records in WebM format
- Requests microphone permission
- Handles permission denial gracefully
- Stops all tracks after recording

### Function Definition Format
```javascript
{
    name: "create_student",
    description: "Create a new student...",
    parameters: {
        type: "object",
        properties: {
            name: { type: "string", description: "..." },
            // ... more parameters
        },
        required: ["name", "classId", ...]
    }
}
```

### API Integration
- Uses Groq's `tools` parameter for function definitions
- Uses `tool_choice: "auto"` to let AI decide when to call functions
- Handles `tool_calls` in response to execute functions
- Sends function results back using `role: "tool"`

### Error Handling
- Try-catch blocks around all function executions
- Returns structured error messages to AI
- Shows user-friendly error toasts
- AI can explain errors in natural language

## System Prompt Enhancement
Updated system prompt to include:
- Instructions for when to use functions
- Requirement to fetch IDs before creating/sending
- Confirmation before executing actions
- Professional and friendly tone

## Future Enhancements

### Voice Features:
1. **Continuous Listening** - Voice activation with wake word
2. **Multi-language Support** - Detect and transcribe multiple languages
3. **Voice Commands** - Direct voice commands without typing
4. **Text-to-Speech** - AI responses read aloud
5. **Noise Cancellation** - Better audio quality in noisy environments

### Additional Functions to Add:
1. **create_staff** - Add new staff members
2. **mark_attendance** - Mark student attendance
3. **create_fee_payment** - Record fee payments
4. **schedule_substitution** - Assign teacher substitutions
5. **send_announcement** - Broadcast announcements
6. **generate_report** - Create various reports

### Improvements:
1. **Confirmation Dialog** - Show confirmation before executing critical actions
2. **Batch Operations** - Create multiple students at once
3. **Form Validation** - More robust validation before API calls
4. **Undo Functionality** - Allow undoing recent actions
5. **Action History** - Log all AI-executed actions
6. **Permission Checks** - Verify user has permission for actions

## Testing Checklist
- [ ] Record voice input (short message)
- [ ] Record voice input (long message)
- [ ] Test with background noise
- [ ] Test microphone permission denial
- [ ] Verify transcription accuracy
- [ ] Test stop recording mid-sentence
- [ ] Create student with all mandatory fields
- [ ] Create student with AI asking for missing fields
- [ ] Send form to staff member
- [ ] Send form to student
- [ ] Handle invalid class names
- [ ] Handle invalid staff/student names
- [ ] Test error scenarios (network failure, invalid data)
- [ ] Verify toast notifications appear
- [ ] Check conversation context is maintained
- [ ] Test with multiple function calls in sequence

## Files Modified
- ✅ `school-dashboard/src/services/aiService.js` - Added function calling & Whisper transcription
- ✅ `school-dashboard/src/components/AiModal.jsx` - Added function handling UI & voice input button

## Dependencies
- Groq API with function calling support
- Groq Whisper API for speech-to-text
- Browser MediaRecorder API
- Existing API endpoints for students, forms, staff
- Toast notifications (react-hot-toast)

## Notes
- Whisper transcription typically takes 1-2 seconds
- Microphone permission is required for voice input
- Recording format is WebM (widely supported)
- Transcription is done server-side (no local processing)
- Voice input works in all modern browsers
- The AI will intelligently gather missing information before calling functions
- All function calls are logged in the conversation for transparency
- Function results are shown to users via toast notifications
