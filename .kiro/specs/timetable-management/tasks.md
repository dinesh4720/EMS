# Implementation Plan

- [x] 1. Extend database models for timetable management





  - Add teacherAssignments field to Staff model
  - Add classTag and assignedSubjects fields to Class model
  - Add metadata fields to Timetable model (lastModified, modifiedBy, version, lastSyncedAt)
  - Create TeacherTimetable model with schedule structure
  - Create ConflictLog model for tracking conflicts
  - Add database indexes for performance optimization
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 9.1_

- [x] 1.1 Write property test for teacher assignment persistence


  - **Property 3: Teacher assignment persistence**
  - **Validates: Requirements 2.4**

- [x] 2. Implement backend API endpoints for class settings





  - Create PUT /api/classes/:id/tag endpoint for updating class tags
  - Create PUT /api/classes/:id/subjects endpoint for updating class subjects
  - Create GET /api/classes/:id/settings endpoint for retrieving class settings
  - Add validation middleware for class settings
  - Add authentication and permission checks
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.1 Write property test for class tag persistence


  - **Property 1: Class tag persistence**
  - **Validates: Requirements 1.4**

- [x] 2.2 Write property test for subject association persistence


  - **Property 2: Subject association persistence**
  - **Validates: Requirements 1.3**

- [x] 3. Implement backend API endpoints for teacher assignments





  - Create GET /api/teacher-assignments/:teacherId endpoint
  - Create POST /api/teacher-assignments endpoint for creating assignments
  - Create PUT /api/teacher-assignments/:id endpoint for updating assignments
  - Create DELETE /api/teacher-assignments/:id endpoint for removing assignments
  - Create GET /api/teacher-assignments/available-teachers endpoint with filtering logic
  - Add validation for teacher-subject-class associations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3.1 Write property test for available teacher filtering by qualification


  - **Property 7: Available teacher filtering by qualification**
  - **Validates: Requirements 3.2, 7.1**

- [x] 3.2 Write property test for teacher assignment query correctness


  - **Property 13: Teacher assignment query correctness**
  - **Validates: Requirements 9.2**

- [x] 4. Implement conflict detection service





  - Create ConflictDetectionService with checkTeacherConflict method
  - Implement getTeacherConflicts method for retrieving all conflicts
  - Implement validateSlotAssignment method
  - Create conflict detection middleware for API endpoints
  - Add conflict logging to ConflictLog model
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4.1 Write property test for conflict detection


  - **Property 6: Conflict detection for double booking**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 4.2 Write property test for conflict error details


  - **Property 12: Conflict error details**
  - **Validates: Requirements 6.4**

- [x] 4.3 Write property test for available teacher filtering by availability


  - **Property 8: Available teacher filtering by availability**
  - **Validates: Requirements 3.3, 7.2**

- [x] 5. Implement timetable synchronization service





  - Create TimetableService with syncTimetables method
  - Implement bidirectional sync from class to teacher timetable
  - Implement bidirectional sync from teacher to class timetable
  - Add transaction-like rollback mechanism for failed syncs
  - Add version tracking to prevent concurrent modification issues
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5.1 Write property test for class-to-teacher synchronization



  - **Property 4: Bidirectional synchronization - class to teacher**
  - **Validates: Requirements 8.1**

- [x] 5.2 Write property test for teacher-to-class synchronization

  - **Property 5: Bidirectional synchronization - teacher to class**
  - **Validates: Requirements 8.2**

- [x] 5.3 Write property test for deletion synchronization from class side

  - **Property 10: Deletion synchronization - class side**
  - **Validates: Requirements 8.3**

- [x] 5.4 Write property test for deletion synchronization from teacher side

  - **Property 11: Deletion synchronization - teacher side**
  - **Validates: Requirements 8.4**

- [x] 6. Extend existing timetable API endpoints





  - Update POST /api/timetable endpoint to trigger synchronization
  - Update PUT /api/timetable/:classId/slot endpoint with conflict checking
  - Add conflict detection before saving slot changes
  - Add synchronization logic after successful slot updates
  - Update response format to include conflict information
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Implement teacher timetable API endpoints





  - Create GET /api/teacher-timetable/:teacherId endpoint
  - Create POST /api/teacher-timetable/:teacherId endpoint
  - Create PUT /api/teacher-timetable/:teacherId/slot endpoint with validation
  - Create GET /api/teacher-timetable/:teacherId/conflicts endpoint
  - Add synchronization to class timetables on teacher timetable updates
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7.1 Write property test for class switch validation


  - **Property 9: Class switch validation**
  - **Validates: Requirements 5.4**

- [x] 8. Implement class switching functionality





  - Add validation logic for class switching in teacher timetable
  - Implement removeTeacherFromSlot method
  - Implement addTeacherToSlot method
  - Add synchronization for both affected class timetables
  - Add rollback mechanism for failed switches
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Create frontend ClassSettingsPanel component





  - Build UI for class tag input (free-text field)
  - Build UI for subject selection (multi-select dropdown)
  - Implement handleTagUpdate method
  - Implement handleSubjectSelection method
  - Add form validation and error handling
  - Integrate with class settings API endpoints
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 10. Create frontend StaffAssignmentPanel component





  - Build UI for viewing teacher assignments
  - Build UI for adding new subject-class assignments
  - Build UI for removing assignments
  - Implement handleAddAssignment method
  - Implement handleRemoveAssignment method
  - Add validation before saving assignments
  - Integrate with teacher assignments API endpoints
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 11. Extend ClassTimetableEditor component





  - Update fetchAvailableTeachers to use new filtering endpoint
  - Add conflict detection when selecting teachers
  - Display conflict warnings in slot editor
  - Update handleSaveSlot to handle conflicts
  - Add synchronization status indicators
  - Show loading states during sync operations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Create TeacherTimetableEditor component





  - Build weekly schedule grid for teacher view
  - Implement slot click handler to edit assignments
  - Add class selection dropdown for each slot
  - Implement handleClassSwitch method
  - Add validation for class switches
  - Display teacher's assigned classes and subjects
  - Show conflict indicators
  - Integrate with teacher timetable API endpoints
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13. Create ConflictIndicator component





  - Build UI for displaying conflict details
  - Show conflicting teacher, classes, day, and period
  - Implement displayConflictDetails method
  - Add resolution suggestion logic
  - Provide options to resolve conflicts (remove one assignment, choose different teacher)
  - Integrate with conflict resolution handlers
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 14. Implement validation and completeness checking





  - Create validation service for timetable completeness
  - Implement empty slot identification for class timetables
  - Implement unassigned period identification for teacher timetables
  - Create validation report generation
  - Build UI for displaying validation results
  - Add statistics for timetable completeness
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 14.1 Write property test for empty slot identification


  - **Property 14: Empty slot identification**
  - **Validates: Requirements 10.1**

- [x] 14.2 Write property test for teacher schedule gap identification

  - **Property 15: Teacher schedule gap identification**
  - **Validates: Requirements 10.2**


- [x] 15. Add timetable management to staff module




  - Add "Timetable" tab to staff detail view
  - Integrate TeacherTimetableEditor component
  - Add "Assignments" section for subject-class management
  - Integrate StaffAssignmentPanel component
  - Add navigation between staff list and timetable view
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 16. Add class settings to classes module





  - Add "Settings" tab to class detail view
  - Integrate ClassSettingsPanel component
  - Display class tag prominently in class header
  - Show assigned subjects in class overview
  - Add navigation to class settings from class list
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 17. Update API service layer in frontend





  - Add classSettingsApi methods (updateTag, updateSubjects, getSettings)
  - Add teacherAssignmentsApi methods (getAll, create, update, delete, getAvailableTeachers)
  - Add teacherTimetableApi methods (get, update, getConflicts)
  - Update timetableApi to handle new response formats
  - Add error handling for conflict errors
  - _Requirements: All_

- [x] 18. Implement error handling and user feedback





  - Add toast notifications for successful operations
  - Add error dialogs for conflicts
  - Add confirmation dialogs for destructive operations
  - Implement loading states for async operations
  - Add retry logic for failed synchronizations
  - Display user-friendly error messages
  - _Requirements: All_

- [x] 19. Add permission checks and authorization





  - Implement permission middleware for new endpoints
  - Add role-based access control for timetable editing
  - Restrict teacher timetable editing based on user role
  - Add permission checks in frontend components
  - Display appropriate UI based on user permissions
  - _Requirements: All_

- [x] 20. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Write integration tests for timetable synchronization





  - Test complete flow from class timetable update to teacher timetable sync
  - Test complete flow from teacher timetable update to class timetable sync
  - Test conflict detection across multiple operations
  - Test rollback mechanism on sync failures

- [x] 22. Write integration tests for conflict scenarios





  - Test double booking prevention
  - Test unqualified teacher assignment prevention
  - Test conflict resolution workflows
  - Test concurrent modification handling

- [x] 23. Write end-to-end tests for user workflows





  - Test creating class timetable from scratch
  - Test editing teacher timetable and verifying class updates
  - Test handling conflict scenarios through UI
  - Test switching classes for a teacher
  - Test managing teacher assignments
  - Test validating timetable completeness

- [x] 24. Performance optimization





  - Add database indexes for frequently queried fields
  - Implement caching for class and teacher lists
  - Add lazy loading for timetable data
  - Implement debouncing for conflict checks
  - Optimize batch operations for multiple slot updates
  - _Requirements: All_

- [x] 25. Documentation and deployment preparation





  - Write user documentation for timetable management
  - Create admin guide for setting up teacher assignments
  - Document API endpoints and request/response formats
  - Create migration scripts for existing data
  - Prepare rollback plan and feature flags
  - Set up monitoring and alerting
  - _Requirements: All_

- [x] 26. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
