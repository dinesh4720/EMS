/**
 * Test user fixtures for different roles
 */
export const testUsers = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'vikram@school.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'password123',
    name: 'Vikram Patel',
    role: 'Admin',
    permissions: ['all']
  },
  teacher: {
    email: process.env.TEST_TEACHER_EMAIL || 'rajesh@school.com',
    password: process.env.TEST_TEACHER_PASSWORD || 'password123',
    name: 'Rajesh Kumar',
    role: 'Teacher',
    permissions: ['students', 'classes', 'attendance', 'timetable']
  },
  accountant: {
    email: process.env.TEST_ACCOUNTANT_EMAIL || 'accountant@test.com',
    password: process.env.TEST_ACCOUNTANT_PASSWORD || 'accountant123',
    name: 'Test Accountant',
    role: 'Accountant',
    permissions: ['fees', 'payroll']
  },
  receptionist: {
    email: process.env.TEST_RECEPTIONIST_EMAIL || 'receptionist@test.com',
    password: process.env.TEST_RECEPTIONIST_PASSWORD || 'receptionist123',
    name: 'Test Receptionist',
    role: 'Receptionist',
    permissions: ['front-desk', 'students']
  }
};

/**
 * Test data for various entities
 */
export const testData = {
  staff: {
    valid: {
      name: 'John Doe',
      email: `john.doe${Date.now()}@test.com`,
      phone: '1234567890',
      role: 'Teacher',
      qualification: 'M.Sc Mathematics',
      experience: '5',
      address: '123 Test Street'
    },
    invalid: {
      name: '',
      email: 'invalid-email',
      phone: '123',
      role: '',
      qualification: '',
      experience: '-1',
      address: ''
    }
  },

  student: {
    valid: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: `jane.smith${Date.now()}@test.com`,
      phone: '9876543210',
      class: 'Class 10',
      section: 'A',
      dob: '2010-01-01',
      gender: 'Female',
      bloodGroup: 'O+',
      fatherName: 'Robert Smith',
      motherName: 'Mary Smith',
      guardianPhone: '9876543211'
    },
    invalid: {
      firstName: '',
      lastName: '',
      email: 'not-an-email',
      phone: 'abc',
      class: '',
      section: '',
      dob: '',
      gender: '',
      bloodGroup: '',
      fatherName: '',
      motherName: '',
      guardianPhone: ''
    }
  },

  fee: {
    valid: {
      name: 'Tuition Fee',
      amount: '5000',
      frequency: 'Monthly',
      category: 'Academic',
      dueDate: '15',
      description: 'Monthly tuition fee'
    },
    installment: {
      studentId: '',
      amount: '5000',
      method: 'Cash',
      date: new Date().toISOString().split('T')[0],
      remarks: 'Test payment'
    }
  },

  attendance: {
    checkIn: {
      latitude: '40.7128',
      longitude: '-74.0060',
      comment: 'Test check-in'
    },
    checkOut: {
      latitude: '40.7128',
      longitude: '-74.0060',
      comment: 'Test check-out'
    }
  },

  message: {
    valid: {
      recipient: 'Test User',
      subject: 'Test Message',
      body: 'This is a test message for automated testing',
      attachment: null
    },
    reply: {
      body: 'This is an automated reply for testing'
    }
  },

  class: {
    valid: {
      name: 'Class 11',
      section: 'A',
      capacity: '40',
      roomNumber: '101',
      teacherId: ''
    },
    invalid: {
      name: '',
      section: '',
      capacity: '-1',
      roomNumber: ''
    }
  },

  leave: {
    valid: {
      type: 'Sick Leave',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      reason: 'Test leave application'
    }
  },

  visitor: {
    valid: {
      name: 'Test Visitor',
      phone: '5555555555',
      purpose: 'Meeting',
      whomToMeet: 'Principal',
      date: new Date().toISOString().split('T')[0],
      timeIn: '10:00',
      timeOut: '11:00'
    }
  }
};
