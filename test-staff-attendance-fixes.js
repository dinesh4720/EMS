/**
 * Test Script for Staff Attendance Fixes
 * 
 * This script tests the following scenarios:
 * 1. Mark attendance from staff app
 * 2. Verify it appears in dashboard
 * 3. Change attendance status from dashboard
 * 4. Test regularization feature
 * 5. Verify calendar displays correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testStaffId = '';

// Helper function to make authenticated requests
async function request(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Login and get auth token
async function testLogin() {
  console.log('\n=== Test 1: Login ===');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@school.com', // Update with your test credentials
      password: 'admin123'
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Get a test staff member
async function getTestStaff() {
  console.log('\n=== Test 2: Get Test Staff ===');
  try {
    const staff = await request('GET', '/staff');
    if (staff.length > 0) {
      testStaffId = staff[0]._id || staff[0].id;
      console.log('✅ Test staff found:', staff[0].name, '(ID:', testStaffId, ')');
      return true;
    } else {
      console.error('❌ No staff found');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to get staff');
    return false;
  }
}

// Test 3: Mark attendance from mobile app (simulating staff app)
async function testMarkAttendanceFromMobile() {
  console.log('\n=== Test 3: Mark Attendance from Mobile App ===');
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await request('POST', '/staff-attendance/mobile/mark', {
      staffId: testStaffId,
      status: 'present',
      reason: '',
      location: { latitude: 0, longitude: 0 }
    });
    
    console.log('✅ Attendance marked from mobile:', result);
    return true;
  } catch (error) {
    console.error('❌ Failed to mark attendance from mobile');
    return false;
  }
}

// Test 4: Verify attendance appears in dashboard
async function testGetAttendanceForDate() {
  console.log('\n=== Test 4: Get Attendance for Date ===');
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await request('GET', `/staff-attendance/date/${today}`);
    
    const staffAttendance = attendance.find(a => 
      (a.staffId._id || a.staffId) === testStaffId
    );
    
    if (staffAttendance) {
      console.log('✅ Attendance found in dashboard:', staffAttendance);
      return true;
    } else {
      console.error('❌ Attendance not found for test staff');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to get attendance for date');
    return false;
  }
}

// Test 5: Change attendance status from dashboard
async function testChangeAttendanceStatus() {
  console.log('\n=== Test 5: Change Attendance Status from Dashboard ===');
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await request('POST', '/staff-attendance', {
      staffId: testStaffId,
      date: today,
      status: 'halfday',
      checkInTime: '09:00',
      checkOutTime: '13:00',
      reason: 'Medical appointment',
      markedBy: testStaffId // In real scenario, this would be admin ID
    });
    
    console.log('✅ Attendance status changed:', result);
    return true;
  } catch (error) {
    console.error('❌ Failed to change attendance status');
    return false;
  }
}

// Test 6: Test regularization feature
async function testRegularization() {
  console.log('\n=== Test 6: Test Regularization ===');
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    const result = await request('PUT', `/staff-attendance/${testStaffId}/regularize`, {
      date: dateStr,
      status: 'present',
      checkInTime: '09:00',
      checkOutTime: '17:00',
      reason: 'Forgot to mark attendance',
      regularizedBy: testStaffId // In real scenario, this would be admin ID
    });
    
    console.log('✅ Attendance regularized:', result);
    return true;
  } catch (error) {
    console.error('❌ Failed to regularize attendance');
    return false;
  }
}

// Test 7: Get attendance history for staff (calendar data)
async function testGetAttendanceHistory() {
  console.log('\n=== Test 7: Get Attendance History (Calendar) ===');
  try {
    const startDate = new Date();
    startDate.setDate(1); // First day of month
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1, 0); // Last day of month
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const attendance = await request('GET', `/staff-attendance/staff/${testStaffId}?startDate=${startStr}&endDate=${endStr}`);
    
    console.log('✅ Attendance history retrieved:', attendance.length, 'records');
    console.log('Sample records:', attendance.slice(0, 3));
    return true;
  } catch (error) {
    console.error('❌ Failed to get attendance history');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Staff Attendance Tests...\n');
  
  const results = {
    login: await testLogin(),
    getStaff: false,
    markFromMobile: false,
    getForDate: false,
    changeStatus: false,
    regularize: false,
    getHistory: false
  };
  
  if (results.login) {
    results.getStaff = await getTestStaff();
    
    if (results.getStaff) {
      results.markFromMobile = await testMarkAttendanceFromMobile();
      
      // Wait a bit for socket events to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      results.getForDate = await testGetAttendanceForDate();
      results.changeStatus = await testChangeAttendanceStatus();
      
      // Wait a bit for socket events to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      results.regularize = await testRegularization();
      results.getHistory = await testGetAttendanceHistory();
    }
  }
  
  console.log('\n=== Test Results Summary ===');
  console.log('Login:', results.login ? '✅' : '❌');
  console.log('Get Staff:', results.getStaff ? '✅' : '❌');
  console.log('Mark from Mobile:', results.markFromMobile ? '✅' : '❌');
  console.log('Get for Date:', results.getForDate ? '✅' : '❌');
  console.log('Change Status:', results.changeStatus ? '✅' : '❌');
  console.log('Regularize:', results.regularize ? '✅' : '❌');
  console.log('Get History:', results.getHistory ? '✅' : '❌');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  console.log(`\n${passedTests}/${totalTests} tests passed`);
}

// Run tests
runAllTests().catch(console.error);
