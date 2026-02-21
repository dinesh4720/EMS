// Diagnostic script to check class dashboard access issues

console.log('=== Class Dashboard Diagnostic ===\n');

// Check 1: User authentication and role
console.log('1. Check your browser console for:');
console.log('   - User object (should have role property)');
console.log('   - Permissions array');
console.log('   - Any authentication errors\n');

// Check 2: Permission system
console.log('2. Common issues:');
console.log('   a) User role not recognized');
console.log('      Solution: Check if role is "Teacher", "Admin", "Principal", etc.');
console.log('   b) Permissions API failing');
console.log('      Solution: Check network tab for /api/permissions/user/:id');
console.log('   c) "classes" module permission missing');
console.log('      Solution: Check permissions array includes {module: "classes", actions: ["view"]}');
console.log('\n');

// Check 3: Routing
console.log('3. URL patterns that should work:');
console.log('   - /classes (list view)');
console.log('   - /classes/:id (specific class dashboard)');
console.log('   - /classes/:id?tab=overview (with tab parameter)');
console.log('\n');

// Check 4: Browser console commands to run
console.log('4. Run these in browser console:');
console.log('   localStorage.getItem("user") // Check stored user');
console.log('   // In React DevTools, find PermissionContext and check:');
console.log('   // - permissions array');
console.log('   // - hasPermission("classes", "view")');
console.log('\n');

// Check 5: Quick fixes
console.log('5. Quick fixes to try:');
console.log('   a) Clear browser cache and localStorage');
console.log('   b) Log out and log back in');
console.log('   c) Check if backend API is running');
console.log('   d) Verify user has "classes" permission in database');
console.log('\n');

console.log('=== End Diagnostic ===');
