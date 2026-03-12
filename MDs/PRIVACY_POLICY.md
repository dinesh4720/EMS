# SchoolSync Privacy Policy Baseline

Last updated: 2026-03-10

This document is a baseline privacy notice for SchoolSync deployments. It is not legal advice. Any school using this system should complete a legal review for the Digital Personal Data Protection Act, 2023 (India), child-data handling requirements, retention schedules, and consent workflows before production use.

## Data categories processed

SchoolSync can process the following categories of personal data:

- Student identity data: name, admission ID, class, roll number, date of birth, gender, nationality, religion, category, mother tongue
- Parent and guardian data: names, phone numbers, emails, relationships, occupations, alternate contacts
- Contact and address data: student phone, email, address, city, state, PIN code, WhatsApp number
- Academic data: attendance, results, remarks, homework submissions, class assignments
- Financial data: fee structures, payments, refunds, discounts, balances
- Safety and health data: medical conditions, emergency contact details, gate pass history, visitor logs linked to students
- Documents and media: uploaded student documents and profile photos

## Why the data is processed

The system processes this data to support normal school operations, including:

- admissions and identity management
- class roster management
- parent communication and emergency contact handling
- attendance and academic reporting
- fee collection and financial administration
- safety, access control, and student welfare workflows

## Children's data

This system is intended for schools, so it processes data about children. Schools must confirm a lawful basis, age-appropriate notices, parental or guardian permissions where required, and internal access controls before using it in production.

## Deletion and retention baseline

The application now supports permanent deletion of a student record and linked personal data instead of only using a recoverable trash state.

Current engineering baseline:

- deleting a student removes the student profile and linked records across the core student-data collections
- the delete flow is intended for validated erasure requests and should not be used as a general archive mechanism
- schools still need a reviewed retention schedule for records that must be retained for statutory, accounting, audit, or litigation-hold reasons

## Current compliance gaps still requiring review

The following items still require product and legal follow-up:

- consent tracking and consent withdrawal records
- school-approved retention periods by data category
- school-specific contact details for privacy requests
- operational review of statutory exceptions to deletion
- legal wording approval for production privacy notices
