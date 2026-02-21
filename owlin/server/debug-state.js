/**
 * Debug script to check Owlin server state
 * Run with: node debug-state.js
 */

import fetch from 'node-fetch'

const API_URL = 'http://localhost:4001/api'

async function checkState() {
  console.log('🔍 Checking Owlin Server State...\n')

  try {
    // Check health
    console.log('1. Health Check')
    const health = await fetch(`${API_URL}/health`).then(r => r.json())
    console.log('   ✓ Server is healthy')
    console.log('   Uptime:', Math.round(health.uptime), 'seconds\n')

    // Check stats
    console.log('2. Statistics')
    const stats = await fetch(`${API_URL}/stats`).then(r => r.json())
    console.log('   Total Users:', stats.stats.totalUsers)
    console.log('   Active Sessions:', stats.stats.activeSessions)
    console.log('   Events Today:', stats.stats.eventsToday)
    console.log('   Events This Hour:', stats.stats.eventsThisHour)
    console.log()

    // Check users
    console.log('3. Users')
    const users = await fetch(`${API_URL}/users`).then(r => r.json())
    if (users.users && users.users.length > 0) {
      console.log(`   Found ${users.users.length} users:`)
      users.users.forEach(user => {
        console.log(`   - ${user.name || user.id} (${user.role || 'no role'})`)
        console.log(`     Email: ${user.email || 'none'}`)
        console.log(`     Events: ${user.eventCount}`)
        console.log(`     Last seen: ${user.lastSeen}`)
      })
    } else {
      console.log('   ⚠️  No users found')
      console.log('   → Log in to school-dashboard to create users')
    }
    console.log()

    // Check sessions
    console.log('4. Sessions')
    const sessions = await fetch(`${API_URL}/sessions`).then(r => r.json())
    if (sessions.sessions && sessions.sessions.length > 0) {
      console.log(`   Found ${sessions.sessions.length} sessions:`)
      sessions.sessions.forEach(session => {
        console.log(`   - ${session.userName || session.userId}`)
        console.log(`     Events: ${session.eventCount}`)
        console.log(`     Pages: ${session.pages?.length || 0}`)
        console.log(`     Active: ${!session.endTime}`)
      })
    } else {
      console.log('   ⚠️  No sessions found')
      console.log('   → Sessions are created when users log in')
    }
    console.log()

    // Check events
    console.log('5. Recent Events')
    const events = await fetch(`${API_URL}/events?limit=5`).then(r => r.json())
    if (events.events && events.events.length > 0) {
      console.log(`   Found ${events.pagination.total} total events (showing 5):`)
      events.events.forEach(event => {
        console.log(`   - ${event.type} by ${event.userName || event.userId}`)
        console.log(`     Page: ${typeof event.page === 'string' ? event.page : event.page?.path}`)
        console.log(`     Time: ${new Date(event.timestamp).toLocaleTimeString()}`)
      })
    } else {
      console.log('   ⚠️  No events found')
      console.log('   → Click around in school-dashboard to generate events')
    }
    console.log()

    // Check page usage
    console.log('6. Page Usage (Today)')
    const pageUsage = await fetch(`${API_URL}/analytics/page-usage?range=today`).then(r => r.json())
    if (pageUsage.data && pageUsage.data.pages && pageUsage.data.pages.length > 0) {
      console.log(`   Top 5 pages:`)
      pageUsage.data.pages.slice(0, 5).forEach((page, i) => {
        console.log(`   ${i + 1}. ${page.page} - ${page.visits} visits (${page.percentage}%)`)
      })
    } else {
      console.log('   ⚠️  No page usage data')
    }
    console.log()

    console.log('✅ Debug complete!')
    console.log('\nNext steps:')
    console.log('1. Open school-dashboard at http://localhost:4000')
    console.log('2. Log in as any user')
    console.log('3. Click around to generate events')
    console.log('4. Check Owlin dashboard at http://localhost:5173')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\nMake sure Owlin server is running:')
    console.log('  cd owlin/server && npm start')
  }
}

checkState()
