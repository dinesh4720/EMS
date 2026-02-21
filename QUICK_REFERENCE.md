# Database Tools - Quick Reference Card

## 🚨 Quick Fixes

### Students Not Showing?
```bash
# 1. Check the issue
node backend/scripts/check-pagination-issues.js

# 2. Fix it
node backend/scripts/fix-database-issues.js

# 3. Restart backend
cd backend && npm start

# 4. Clear browser cache (Ctrl+Shift+R)
```

### Class Count Wrong?
```bash
# Fix class strengths
node backend/scripts/fix-database-issues.js
# Select option 2 (Update class strength)
```

## 📊 Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `check-pagination-issues.js` | Full diagnostic | Monthly or when issues suspected |
| `fix-database-issues.js` | Apply fixes | After diagnostic shows issues |
| `monitor-database-health.js` | Health check | Daily (can be automated) |
| `check-5a-data.js` | Class-specific check | Debug specific class issues |

## 🔍 Common Issues & Solutions

### Issue: "Only showing X students"
**Cause**: Pagination limit  
**Fix**: Already fixed in code (limit increased to 1000)  
**Verify**: Restart backend + clear cache

### Issue: "Class strength is 0"
**Cause**: Field not updated  
**Fix**: Run `fix-database-issues.js` → Option 2

### Issue: "Students missing isDeleted field"
**Cause**: Legacy data  
**Fix**: Run `fix-database-issues.js` → Option 1

### Issue: "Invalid status values"
**Cause**: Data import or manual edits  
**Fix**: Run `fix-database-issues.js` → Option 3

## 📁 File Locations

```
backend/scripts/
├── check-pagination-issues.js    # Main diagnostic
├── fix-database-issues.js        # Main fix tool
├── monitor-database-health.js    # Health monitor
├── check-5a-data.js              # Class checker
└── README.md                     # Full documentation

backend/logs/
└── health-report-latest.json     # Latest health report
```

## 🎯 Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Healthy | No action needed |
| 1 | Warnings | Consider running fixes |
| 2 | Critical | Run fixes immediately |

## 💡 Pro Tips

1. **Before major updates**: Run diagnostic
2. **After data import**: Run diagnostic + fixes
3. **Monthly maintenance**: Run diagnostic
4. **Automate monitoring**: Schedule health checks

## 🔗 Quick Links

- Full Documentation: `backend/scripts/README.md`
- Issue Resolution: `DATABASE_ISSUE_RESOLUTION.md`
- Initial Analysis: `fix-5a-data.md`

## 📞 Emergency Checklist

- [ ] Run diagnostic script
- [ ] Check output for critical issues
- [ ] Run fix script if needed
- [ ] Restart backend server
- [ ] Clear browser cache
- [ ] Verify in dashboard
- [ ] Check logs if still failing

## 🔄 Regular Maintenance Schedule

| Frequency | Task | Command |
|-----------|------|---------|
| Daily | Health check | `monitor-database-health.js` |
| Weekly | Quick diagnostic | `check-pagination-issues.js` |
| Monthly | Full diagnostic + fixes | Both scripts |
| After import | Diagnostic + fixes | Both scripts |

---

**Keep this file handy for quick reference!**
