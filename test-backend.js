// Quick test script to check if backend is responding
// Run with: node test-backend.js

const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method: 'GET',
      timeout: 5000
    };

    console.log(`Testing: http://localhost:3001/api${path}`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${path}: Status ${res.statusCode}, ${Array.isArray(json) ? json.length + ' items' : 'object'}`);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          console.log(`✅ ${path}: Status ${res.statusCode}, Response: ${data.substring(0, 100)}`);
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${path}: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.error(`⏱️ ${path}: Request timeout`);
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
};

async function runTests() {
  console.log('🧪 Testing Backend Endpoints...\n');

  try {
    await testEndpoint('/students');
    await testEndpoint('/staff');
    await testEndpoint('/classes');
    
    console.log('\n✅ All tests passed! Backend is responding correctly.');
    console.log('\nIf frontend still not loading, the issue is with:');
    console.log('1. Frontend not restarted after .env change');
    console.log('2. Browser cache (try Ctrl+Shift+Delete)');
    console.log('3. Check browser console for errors');
  } catch (error) {
    console.log('\n❌ Backend test failed!');
    console.log('\nPossible issues:');
    console.log('1. Backend not running (run: cd backend && npm start)');
    console.log('2. Backend running on different port');
    console.log('3. MongoDB connection issue');
  }
}

runTests();
