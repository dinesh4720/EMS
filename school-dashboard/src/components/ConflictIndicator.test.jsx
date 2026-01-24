/**
 * ConflictIndicator Component Test Examples
 * 
 * This file demonstrates the ConflictIndicator component with various conflict scenarios.
 * It can be used for manual testing and verification.
 */

import ConflictIndicator from './ConflictIndicator';

// Example conflict data for testing

export const mockConflicts = {
  // Double booking conflict
  doubleBooking: [
    {
      type: 'double_booking',
      teacherId: 'teacher123',
      teacherName: 'John Smith',
      teacherCode: 'T001',
      day: 'Monday',
      periodIndex: 2,
      conflicts: [
        {
          classId: 'class1',
          className: 'Class 10 A',
          subject: 'Mathematics',
          room: 'Room 101'
        },
        {
          classId: 'class2',
          className: 'Class 10 B',
          subject: 'Mathematics',
          room: 'Room 102'
        }
      ],
      message: 'Teacher John Smith is already assigned to Class 10 A for Mathematics at Monday Period 3'
    }
  ],

  // Unqualified teacher conflict
  unqualified: [
    {
      type: 'unqualified',
      teacherId: 'teacher456',
      teacherName: 'Jane Doe',
      teacherCode: 'T002',
      day: 'Tuesday',
      periodIndex: 4,
      subject: 'Physics',
      classId: 'class3',
      className: 'Class 11 A',
      message: 'Teacher Jane Doe is not qualified to teach Physics in Class 11 A'
    }
  ],

  // Multiple conflicts
  multiple: [
    {
      type: 'double_booking',
      teacherId: 'teacher789',
      teacherName: 'Bob Johnson',
      teacherCode: 'T003',
      day: 'Wednesday',
      periodIndex: 1,
      conflicts: [
        {
          classId: 'class4',
          className: 'Class 9 A',
          subject: 'English',
          room: 'Room 201'
        }
      ],
      message: 'Teacher Bob Johnson is already assigned to Class 9 A for English at Wednesday Period 2'
    },
    {
      type: 'double_booking',
      teacherId: 'teacher789',
      teacherName: 'Bob Johnson',
      teacherCode: 'T003',
      day: 'Thursday',
      periodIndex: 3,
      conflicts: [
        {
          classId: 'class5',
          className: 'Class 9 B',
          subject: 'English',
          room: 'Room 202'
        }
      ],
      message: 'Teacher Bob Johnson is already assigned to Class 9 B for English at Thursday Period 4'
    }
  ],

  // Invalid assignment
  invalid: [
    {
      type: 'invalid_assignment',
      teacherId: 'teacher999',
      teacherName: 'Alice Brown',
      teacherCode: 'T004',
      day: 'Friday',
      periodIndex: 5,
      message: 'Invalid assignment: Teacher not found or assignment data is incomplete'
    }
  ]
};

// Example usage component
export function ConflictIndicatorExamples() {
  const handleResolve = (resolutionData) => {
    console.log('Resolution selected:', resolutionData);
    alert(`Resolution action: ${resolutionData.action}\nConflict type: ${resolutionData.conflict.type}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">ConflictIndicator Component Examples</h1>

      {/* Example 1: Double Booking Conflict */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">1. Double Booking Conflict (Full View)</h2>
        <ConflictIndicator
          conflicts={mockConflicts.doubleBooking}
          onResolve={handleResolve}
        />
      </div>

      {/* Example 2: Unqualified Teacher Conflict */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">2. Unqualified Teacher Conflict</h2>
        <ConflictIndicator
          conflicts={mockConflicts.unqualified}
          onResolve={handleResolve}
        />
      </div>

      {/* Example 3: Multiple Conflicts */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">3. Multiple Conflicts</h2>
        <ConflictIndicator
          conflicts={mockConflicts.multiple}
          onResolve={handleResolve}
        />
      </div>

      {/* Example 4: Compact View */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">4. Compact View</h2>
        <ConflictIndicator
          conflicts={mockConflicts.doubleBooking}
          onResolve={handleResolve}
          compact={true}
        />
      </div>

      {/* Example 5: Invalid Assignment */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">5. Invalid Assignment</h2>
        <ConflictIndicator
          conflicts={mockConflicts.invalid}
          onResolve={handleResolve}
        />
      </div>

      {/* Example 6: No Conflicts (should render nothing) */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">6. No Conflicts (Empty State)</h2>
        <div className="p-4 border border-dashed border-default-300 rounded-lg">
          <ConflictIndicator
            conflicts={[]}
            onResolve={handleResolve}
          />
          <p className="text-sm text-default-500 text-center">
            (Component should render nothing when there are no conflicts)
          </p>
        </div>
      </div>
    </div>
  );
}

export default ConflictIndicatorExamples;
