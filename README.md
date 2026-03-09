# EMS Monorepo

This repository contains the Education Management System and one internal analytics subsystem used by it.

## Applications

- `backend/`: core EMS API
- `school-dashboard/`: admin and teacher web app
- `parent-app/`: parent mobile app
- `staff-app/`: staff mobile app
- `owlin/`: internal activity-tracking and analytics tooling for EMS

## What `owlin` Is

`owlin` is not an unrelated product parked in the repository. It is the internal analytics stack for EMS:

- `owlin/sdk` provides the tracking SDK consumed by `school-dashboard`
- `owlin/server` receives and stores tracking events
- `owlin/src` is the analytics dashboard used to inspect those events

Current scope:

- `school-dashboard` is integrated with `owlin`
- `parent-app` and `staff-app` are not yet integrated

That boundary is intentional for now, but it should stay explicit. If `owlin` needs to become a standalone product later, it should be moved to its own repository rather than copied piecemeal into EMS.
