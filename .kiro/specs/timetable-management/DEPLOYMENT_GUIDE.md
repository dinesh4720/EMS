# Timetable Management System - Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Steps](#deployment-steps)
3. [Feature Flags](#feature-flags)
4. [Rollback Plan](#rollback-plan)
5. [Monitoring Setup](#monitoring-setup)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

### Database Preparation
- [ ] **Backup Database**
  ```bash
  mongodump --db school_db --out backup_$(date +%Y%m%d_%H%M%S)
  ```
- [ ] **Verify Backup**
  ```bash
  # Check backup size and contents
  du -sh backup_*
  ls -la backup_*/school_db/
  ```
- [ ] **Test Restore Process** (on staging)
  ```bash
  mongorestore --db school_db_test backup_YYYYMMDD_HHMMSS/school_db
  ```

### Code Preparation
- [ ] **Pull Latest Code**
  ```bash
  git pull origin main
  ```
- [ ] **Install Dependencies**
  ```bash
  cd backend && npm install
  cd ../school-dashboard && npm install
  ```
- [ ] **Run Tests**
  ```bash
  cd backend && npm test
  cd ../school-dashboard && npm test
  ```
- [ ] **Build Frontend**
  ```bash
  cd school-dashboard && npm run build
  ```

### Environment Configuration
- [ ] **Update Environment Variables**
  ```bash
  # backend/.env
  ENABLE_TIMETABLE_MANAGEMENT=false  # Start disabled
  TIMETABLE_CACHE_TTL=3600
  CONFLICT_CHECK_ENABLED=true
  ENABLE_TIMETABLE_CACHE=true
  CACHE_TTL=3600
  ```

### Testing
- [ ] **Run Integration Tests**
  ```bash
  cd backend && npm run test:integration
  ```
- [ ] **Run E2E Tests**
  ```bash
  cd school-dashboard && npm run test:e2e
  ```
- [ ] **Manual Testing on Staging**
  - Create test class timetable
  - Create test teacher timetable
  - Verify synchronization
  - Test conflict detection
  - Test validation reports

### Documentation
- [ ] **Review User Guide**
- [ ] **Review Admin Guide**
- [ ] **Review API Documentation**
- [ ] **Prepare Training Materials**

### Communication
- [ ] **Notify Stakeholders** of deployment schedule
- [ ] **Prepare Announcement** for users
- [ ] **Schedule Training Sessions**
- [ ] **Prepare Support Team**

## Deployment Steps

### Phase 1: Database Migration (Maintenance Window)

**Estimated Time:** 15-30 minutes

1. **Enable Maintenance Mode**
   ```bash
   # Set maintenance flag
   echo "MAINTENANCE_MODE=true" >> backend/.env
   
   # Restart server to show maintenance page
   pm2 restart school-backend
   ```

2. **Final Backup**
   ```bash
   mongodump --db school_db --out backup_pre_migration_$(date +%Y%m%d_%H%M%S)
   ```

3. **Run Migration**
   ```bash
   cd backend
   node migrations/001_add_timetable_fields.js
   ```

4. **Verify Migration**
   ```bash
   node migrations/verify_migration.js
   ```

5. **Check Logs**
   ```bash
   tail -f logs/migration.log
   ```

### Phase 2: Backend Deployment

**Estimated Time:** 10-15 minutes

1. **Deploy Backend Code**
   ```bash
   cd backend
   
   # Stop server
   pm2 stop school-backend
   
   # Pull latest code (if not already done)
   git pull origin main
   
   # Install dependencies
   npm install
   
   # Start server
   pm2 start school-backend
   
   # Check status
   pm2 status
   pm2 logs school-backend --lines 50
   ```

2. **Verify Backend Health**
   ```bash
   # Check health endpoint
   curl http://localhost:3001/api/health
   
   # Check timetable endpoints
   curl -H "Authorization: Bearer $TOKEN" \
        http://localhost:3001/api/timetable/test_class_id
   ```

### Phase 3: Frontend Deployment

**Estimated Time:** 10-15 minutes

1. **Build Frontend**
   ```bash
   cd school-dashboard
   npm run build
   ```

2. **Deploy to Server**
   ```bash
   # Copy build files to web server
   rsync -avz dist/ /var/www/school-dashboard/
   
   # Or deploy to CDN/hosting service
   # npm run deploy
   ```

3. **Clear CDN Cache** (if applicable)
   ```bash
   # Example for Cloudflare
   curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CF_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}'
   ```

### Phase 4: Enable Feature

**Estimated Time:** 5 minutes

1. **Enable Feature Flag**
   ```bash
   # Update backend/.env
   ENABLE_TIMETABLE_MANAGEMENT=true
   
   # Restart backend
   pm2 restart school-backend
   ```

2. **Disable Maintenance Mode**
   ```bash
   # Remove maintenance flag
   sed -i '/MAINTENANCE_MODE/d' backend/.env
   
   # Restart server
   pm2 restart school-backend
   ```

3. **Verify Feature is Live**
   - Login to application
   - Navigate to Classes module
   - Verify Timetable tab appears
   - Navigate to Staff module
   - Verify Timetable and Assignments tabs appear

### Phase 5: Gradual Rollout (Optional)

For large deployments, consider gradual rollout:

1. **Enable for Admin Users Only**
   ```javascript
   // backend/middleware/featureFlags.js
   const isTimetableEnabled = (req) => {
     if (!process.env.ENABLE_TIMETABLE_MANAGEMENT) return false;
     
     // Enable only for admins initially
     return req.user.role === 'admin' || req.user.role === 'principal';
   };
   ```

2. **Monitor for Issues**
   - Check error logs
   - Monitor performance metrics
   - Gather user feedback

3. **Enable for All Users**
   ```javascript
   // Remove role restriction
   const isTimetableEnabled = (req) => {
     return process.env.ENABLE_TIMETABLE_MANAGEMENT === 'true';
   };
   ```

## Feature Flags

### Configuration

Feature flags allow you to enable/disable features without code deployment.

**Backend Configuration:**
```javascript
// backend/config/featureFlags.js
module.exports = {
  timetableManagement: {
    enabled: process.env.ENABLE_TIMETABLE_MANAGEMENT === 'true',
    features: {
      classTimetable: true,
      teacherTimetable: true,
      conflictDetection: process.env.CONFLICT_CHECK_ENABLED === 'true',
      validation: true,
      synchronization: true
    }
  }
};
```

**Frontend Configuration:**
```javascript
// school-dashboard/src/config/features.js
export const features = {
  timetableManagement: {
    enabled: import.meta.env.VITE_ENABLE_TIMETABLE === 'true',
    classTimetable: true,
    teacherTimetable: true,
    validation: true
  }
};
```

### Usage

**Backend:**
```javascript
const { timetableManagement } = require('./config/featureFlags');

router.get('/api/timetable/:classId', (req, res) => {
  if (!timetableManagement.enabled) {
    return res.status(404).json({ error: 'Feature not available' });
  }
  // ... handle request
});
```

**Frontend:**
```javascript
import { features } from '@/config/features';

function TimetableTab() {
  if (!features.timetableManagement.enabled) {
    return null;
  }
  
  return <TimetableEditor />;
}
```

### Feature Flag Management

**Enable Feature:**
```bash
# Backend
echo "ENABLE_TIMETABLE_MANAGEMENT=true" >> backend/.env
pm2 restart school-backend

# Frontend
echo "VITE_ENABLE_TIMETABLE=true" >> school-dashboard/.env
npm run build && npm run deploy
```

**Disable Feature:**
```bash
# Backend
sed -i 's/ENABLE_TIMETABLE_MANAGEMENT=true/ENABLE_TIMETABLE_MANAGEMENT=false/' backend/.env
pm2 restart school-backend

# Frontend
sed -i 's/VITE_ENABLE_TIMETABLE=true/VITE_ENABLE_TIMETABLE=false/' school-dashboard/.env
npm run build && npm run deploy
```

## Rollback Plan

### Quick Rollback (Disable Feature)

**Time Required:** 2-5 minutes

1. **Disable Feature Flag**
   ```bash
   # Backend
   sed -i 's/ENABLE_TIMETABLE_MANAGEMENT=true/ENABLE_TIMETABLE_MANAGEMENT=false/' backend/.env
   pm2 restart school-backend
   ```

2. **Verify Feature is Disabled**
   - Timetable tabs should not appear in UI
   - API endpoints should return 404

### Full Rollback (Revert Code and Database)

**Time Required:** 30-60 minutes

1. **Enable Maintenance Mode**
   ```bash
   echo "MAINTENANCE_MODE=true" >> backend/.env
   pm2 restart school-backend
   ```

2. **Revert Code**
   ```bash
   # Backend
   cd backend
   git revert <commit-hash>
   npm install
   pm2 restart school-backend
   
   # Frontend
   cd school-dashboard
   git revert <commit-hash>
   npm install
   npm run build
   # Deploy build
   ```

3. **Rollback Database**
   ```bash
   # Run rollback script
   cd backend
   node migrations/rollback_timetable_migration.js
   ```

4. **Restore from Backup** (if rollback script fails)
   ```bash
   # Stop application
   pm2 stop school-backend
   
   # Restore database
   mongorestore --db school_db --drop backup_pre_migration_YYYYMMDD_HHMMSS/school_db
   
   # Start application
   pm2 start school-backend
   ```

5. **Verify Rollback**
   ```bash
   # Check database
   mongo school_db --eval "db.staff.findOne()"
   # Should not have teacherAssignments field
   
   # Check application
   curl http://localhost:3001/api/health
   ```

6. **Disable Maintenance Mode**
   ```bash
   sed -i '/MAINTENANCE_MODE/d' backend/.env
   pm2 restart school-backend
   ```

### Rollback Decision Tree

```
Issue Detected
    ↓
Is it critical?
    ↓ Yes → Quick Rollback (disable feature)
    ↓ No  → Monitor and fix
    ↓
Can it be fixed quickly? (< 30 min)
    ↓ Yes → Apply hotfix
    ↓ No  → Full Rollback
```

## Monitoring Setup

### Application Monitoring

1. **Setup PM2 Monitoring**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

2. **Configure Error Tracking** (e.g., Sentry)
   ```javascript
   // backend/config/monitoring.js
   const Sentry = require('@sentry/node');
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1
   });
   ```

3. **Setup Custom Metrics**
   ```javascript
   // backend/services/metrics.js
   const metrics = {
     timetableOperations: 0,
     conflictsDetected: 0,
     syncFailures: 0,
     apiResponseTimes: []
   };
   
   // Expose metrics endpoint
   app.get('/api/metrics', (req, res) => {
     res.json(metrics);
   });
   ```

### Database Monitoring

1. **Enable MongoDB Profiling**
   ```javascript
   // Enable profiling for slow queries (> 100ms)
   db.setProfilingLevel(1, { slowms: 100 });
   ```

2. **Monitor Collection Sizes**
   ```bash
   # Create monitoring script
   cat > monitor_db.sh << 'EOF'
   #!/bin/bash
   mongo school_db --eval "
     print('Timetables:', db.timetables.count());
     print('Teacher Timetables:', db.teachertimetables.count());
     print('Conflict Logs:', db.conflictlogs.count());
     print('DB Size:', db.stats().dataSize);
   "
   EOF
   
   chmod +x monitor_db.sh
   
   # Add to cron
   crontab -e
   # Add: */15 * * * * /path/to/monitor_db.sh >> /var/log/db_monitor.log
   ```

### Performance Monitoring

1. **Setup Response Time Monitoring**
   ```javascript
   // backend/middleware/monitoring.js
   const responseTime = require('response-time');
   
   app.use(responseTime((req, res, time) => {
     if (req.path.includes('/timetable')) {
       metrics.apiResponseTimes.push({
         path: req.path,
         method: req.method,
         time: time,
         timestamp: new Date()
       });
     }
   }));
   ```

2. **Monitor Cache Hit Rates**
   ```javascript
   // backend/services/cacheService.js
   const cacheStats = {
     hits: 0,
     misses: 0,
     hitRate: () => cacheStats.hits / (cacheStats.hits + cacheStats.misses)
   };
   ```

### Alerting

1. **Setup Alert Rules**
   ```javascript
   // backend/services/alerting.js
   const alerts = {
     highErrorRate: {
       threshold: 0.05, // 5% error rate
       action: sendEmailAlert
     },
     slowResponseTime: {
       threshold: 1000, // 1 second
       action: sendSlackAlert
     },
     syncFailures: {
       threshold: 10, // 10 failures
       action: sendPagerDutyAlert
     }
   };
   ```

2. **Configure Alert Channels**
   ```bash
   # Email alerts
   ALERT_EMAIL=admin@school.edu
   
   # Slack webhook
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   
   # PagerDuty
   PAGERDUTY_API_KEY=...
   ```

### Monitoring Dashboard

Create a simple monitoring dashboard:

```javascript
// backend/routes/admin.js
router.get('/admin/timetable-metrics', requireAdmin, async (req, res) => {
  const metrics = {
    operations: {
      total: await getOperationCount(),
      today: await getTodayOperationCount(),
      avgResponseTime: calculateAvgResponseTime()
    },
    conflicts: {
      active: await getActiveConflictCount(),
      resolved: await getResolvedConflictCount(),
      detectionRate: calculateDetectionRate()
    },
    synchronization: {
      successRate: calculateSyncSuccessRate(),
      failures: await getSyncFailureCount(),
      avgSyncTime: calculateAvgSyncTime()
    },
    cache: {
      hitRate: getCacheHitRate(),
      size: getCacheSize()
    },
    database: {
      timetables: await db.timetables.countDocuments(),
      teacherTimetables: await db.teachertimetables.countDocuments(),
      conflictLogs: await db.conflictlogs.countDocuments()
    }
  };
  
  res.json(metrics);
});
```

## Post-Deployment Verification

### Automated Checks

Run the verification script:

```bash
cd backend
node scripts/verify_deployment.js
```

### Manual Verification Checklist

- [ ] **Login to Application**
  - Admin user can login
  - Regular user can login

- [ ] **Class Module**
  - [ ] Timetable tab appears
  - [ ] Settings tab appears
  - [ ] Can view existing timetables
  - [ ] Can create new timetable entry
  - [ ] Can edit timetable entry
  - [ ] Can delete timetable entry

- [ ] **Staff Module**
  - [ ] Timetable tab appears
  - [ ] Assignments tab appears
  - [ ] Can view teacher timetable
  - [ ] Can edit teacher timetable
  - [ ] Can add teacher assignment
  - [ ] Can remove teacher assignment

- [ ] **Synchronization**
  - [ ] Update class timetable → verify teacher timetable updates
  - [ ] Update teacher timetable → verify class timetable updates
  - [ ] Delete from class → verify removed from teacher
  - [ ] Delete from teacher → verify removed from class

- [ ] **Conflict Detection**
  - [ ] Attempt double-booking → verify conflict error
  - [ ] Conflict indicator appears
  - [ ] Conflict details are correct
  - [ ] Can resolve conflict

- [ ] **Validation**
  - [ ] Validation dashboard loads
  - [ ] Shows correct completeness percentages
  - [ ] Identifies empty slots
  - [ ] Identifies teacher gaps

- [ ] **Performance**
  - [ ] Pages load within 2 seconds
  - [ ] No console errors
  - [ ] No memory leaks
  - [ ] API responses < 500ms

### Load Testing

Run load tests to verify performance:

```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

**load-test.yml:**
```yaml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Get class timetable"
    flow:
      - get:
          url: "/api/timetable/{{ classId }}"
          headers:
            Authorization: "Bearer {{ token }}"
```

## Troubleshooting

### Common Issues

#### Issue: Migration Fails

**Symptoms:**
- Migration script exits with error
- Database not updated

**Solution:**
1. Check error message in logs
2. Verify database connection
3. Check for insufficient permissions
4. Restore from backup and retry
5. Contact support if issue persists

#### Issue: Feature Not Appearing

**Symptoms:**
- Timetable tabs don't appear
- API returns 404

**Solution:**
1. Verify feature flag is enabled
2. Check browser cache (hard refresh)
3. Verify user has correct permissions
4. Check backend logs for errors

#### Issue: Synchronization Not Working

**Symptoms:**
- Changes in class timetable don't appear in teacher timetable
- Sync errors in logs

**Solution:**
1. Check sync service logs
2. Run sync repair script:
   ```bash
   node scripts/repair_sync.js
   ```
3. Verify database indexes exist
4. Check for version conflicts

#### Issue: Performance Degradation

**Symptoms:**
- Slow page loads
- High database CPU
- Timeout errors

**Solution:**
1. Check database indexes
2. Enable caching
3. Review slow query logs
4. Optimize queries
5. Consider scaling database

### Emergency Contacts

- **System Administrator:** admin@school.edu
- **Development Team:** dev@school.edu
- **Database Admin:** dba@school.edu
- **Emergency Hotline:** +1-XXX-XXX-XXXX

### Support Resources

- User Guide: `.kiro/specs/timetable-management/USER_GUIDE.md`
- Admin Guide: `.kiro/specs/timetable-management/ADMIN_GUIDE.md`
- API Documentation: `.kiro/specs/timetable-management/API_DOCUMENTATION.md`
- GitHub Issues: https://github.com/school/dashboard/issues

---

**Version:** 1.0  
**Last Updated:** January 2025
