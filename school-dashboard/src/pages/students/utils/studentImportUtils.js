/**
 * Student Import Utilities
 * Pure functions for CSV parsing, field validation, and import transformation.
 * Extracted from StudentsList.jsx to keep the component lean.
 */

// ─── CSV Parsing ─────────────────────────────────────────────────────────────

/**
 * Parse a single CSV line respecting quoted fields (RFC 4180).
 * Handles commas inside double-quoted values and escaped double-quotes ("").
 */
const parseCSVLine = (line) => {
    const fields = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                // Check for escaped double-quote ("")
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i += 2;
                } else {
                    // End of quoted field
                    inQuotes = false;
                    i++;
                }
            } else {
                current += char;
                i++;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
                i++;
            } else if (char === ',') {
                fields.push(current.trim());
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
    }

    // Push the last field
    fields.push(current.trim());
    return fields;
};

export const parseCSV = (csvText) => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }

    const headers = parseCSVLine(lines[0]);

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        if (values.every(v => !v)) continue;

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        data.push(row);
    }

    return data;
};

// ─── Field Validators ─────────────────────────────────────────────────────────

export const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { valid: false, message: `${fieldName} is required` };
    }
    return { valid: true };
};

export const validateEmail = (email) => {
    if (!email || email.trim() === '') {
        return { valid: true };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }
    return { valid: true };
};

export const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') {
        return { valid: true };
    }
    const phoneClean = phone.toString().replace(/\D/g, '');
    if (phoneClean.length !== 10) {
        return { valid: false, message: 'Phone number must be 10 digits' };
    }
    return { valid: true };
};

export const validateDate = (date) => {
    if (!date || date.trim() === '') {
        return { valid: true };
    }
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const dmyDateRegex = /^\d{2}-\d{2}-\d{4}$/;

    let parsedDate;
    if (isoDateRegex.test(date)) {
        parsedDate = new Date(date);
    } else if (dmyDateRegex.test(date)) {
        const parts = date.split('-');
        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
        return { valid: false, message: 'Date must be in DD-MM-YYYY or YYYY-MM-DD format' };
    }

    if (isNaN(parsedDate.getTime())) {
        return { valid: false, message: 'Invalid date' };
    }

    return { valid: true };
};

export const validateAadhaar = (aadhaar) => {
    if (!aadhaar || aadhaar.trim() === '') {
        return { valid: true };
    }
    const aadhaarClean = aadhaar.toString().replace(/\D/g, '');
    if (aadhaarClean.length !== 12) {
        return { valid: false, message: 'Aadhaar number must be 12 digits' };
    }
    return { valid: true };
};

export const validateZip = (zip) => {
    if (!zip || zip.trim() === '') {
        return { valid: true };
    }
    const zipClean = zip.toString().replace(/\D/g, '');
    if (zipClean.length !== 6) {
        return { valid: false, message: 'Zip code must be 6 digits' };
    }
    return { valid: true };
};

// ─── Class / Section Helpers ──────────────────────────────────────────────────

export const normalizeClassName = (className) => {
    if (!className) return '';
    return className
        .replace(/^Class\s*/i, '')
        .replace(/^\d+\s*-\s*/, '')
        .trim();
};

export const validateClassSection = (studentData, classes) => {
    const className = studentData.class;
    const sectionName = studentData.section || '';

    if (!className) {
        return { valid: false, message: 'Class is required' };
    }

    const normalizedClass = normalizeClassName(className);

    const matchedClasses = classes.filter(c => {
        if (c.name === className) return true;
        if (c.name === `Class ${className}`) return true;
        if (normalizedClass && (c.name === normalizedClass || c.name === `Class ${normalizedClass}`)) return true;
        if (c.name.toLowerCase() === className.toLowerCase()) return true;
        if (normalizedClass && c.name.toLowerCase() === `class ${normalizedClass}`.toLowerCase()) return true;
        return false;
    });

    if (matchedClasses.length === 0) {
        return {
            valid: false,
            message: `Class "${className}" not found in system. Available classes: ${classes.map(c => c.name + (c.section ? `-${c.section}` : '')).join(', ')}`
        };
    }

    if (!sectionName || sectionName.trim() === '') {
        const classesWithSections = matchedClasses.filter(c => c.section && c.section.trim() !== '');
        if (classesWithSections.length > 0) {
            const availableSections = [...new Set(classesWithSections.map(c => c.section))].sort();
            return {
                valid: false,
                message: `Class "${className}" has sections (${availableSections.join(', ')}). Please specify section in CSV.`
            };
        }
        return {
            valid: true,
            warning: `Class "${className}" has no sections, student will be added to general class`
        };
    }

    const classWithSection = matchedClasses.find(c =>
        (c.section || '') === sectionName ||
        (c.section || '').toString() === sectionName.toString()
    );

    if (!classWithSection) {
        const availableSections = [...new Set(matchedClasses.filter(c => c.section).map(c => c.section))].sort();
        if (availableSections.length > 0) {
            return {
                valid: false,
                message: `Section "${sectionName}" not found for Class "${className}". Available sections: ${availableSections.join(', ')}`
            };
        }
        return {
            valid: false,
            message: `Class "${className}" does not have section "${sectionName}"`
        };
    }

    return { valid: true };
};

// ─── Student Validation ───────────────────────────────────────────────────────

export const validateStudentData = (student, existingStudents = [], allClasses = []) => {
    const errors = {};
    const warnings = [];

    const nameValidation = validateRequired(student.name, 'name');
    if (!nameValidation.valid) errors.name = nameValidation.message;

    const classSectionValidation = validateClassSection(student, allClasses);
    if (!classSectionValidation.valid) errors.class = classSectionValidation.message;
    if (classSectionValidation.warning) warnings.push(classSectionValidation.warning);

    if (student.gender && student.gender.trim() !== '') {
        const validGenders = ['Male', 'Female', 'Other'];
        if (!validGenders.includes(student.gender)) {
            errors.gender = `Gender must be one of: ${validGenders.join(', ')}`;
        }
    }

    const parentNameValidation = validateRequired(student.parentName, 'parentName');
    if (!parentNameValidation.valid) errors.parentName = parentNameValidation.message;

    const parentPhoneValidation = validatePhone(student.parentPhone);
    if (!parentPhoneValidation.valid) errors.parentPhone = parentPhoneValidation.message;

    if (student.email && student.email.trim() !== '') {
        const emailValidation = validateEmail(student.email);
        if (!emailValidation.valid) errors.email = emailValidation.message;
    }

    if (student.phone && student.phone.trim() !== '') {
        const phoneValidation = validatePhone(student.phone);
        if (!phoneValidation.valid) errors.phone = phoneValidation.message;
    }

    if (student.dateOfBirth && student.dateOfBirth.trim() !== '') {
        const dateValidation = validateDate(student.dateOfBirth);
        if (!dateValidation.valid) errors.dateOfBirth = dateValidation.message;
    }

    if (student.aadhaarNumber && student.aadhaarNumber.trim() !== '') {
        const aadhaarValidation = validateAadhaar(student.aadhaarNumber);
        if (!aadhaarValidation.valid) errors.aadhaarNumber = aadhaarValidation.message;
    }

    if (student.zipCode && student.zipCode.trim() !== '') {
        const zipValidation = validateZip(student.zipCode);
        if (!zipValidation.valid) errors.zipCode = zipValidation.message;
    }

    if (!student.email || student.email.trim() === '') warnings.push('Email is recommended but not provided');
    if (!student.phone || student.phone.trim() === '') warnings.push('Student phone number is recommended but not provided');
    if (!student.dateOfBirth || student.dateOfBirth.trim() === '') warnings.push('Date of birth is recommended but not provided');

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        warnings,
        data: student,
        isDuplicate: false
    };
};

export const checkForDuplicates = (validatedStudents, existingStudents) => {
    return validatedStudents.map(student => {
        const duplicateById = existingStudents.find(existing =>
            existing.admissionId === student.data.admissionId
        );

        const duplicateByDetails = existingStudents.find(existing =>
            existing.name.toLowerCase() === student.data.name.toLowerCase() &&
            existing.class === student.data.class &&
            existing.parentPhone === student.data.parentPhone
        );

        if (duplicateById) {
            return {
                ...student,
                isDuplicate: true,
                errors: {
                    ...student.errors,
                    duplicate: `Student with admission ID "${student.data.admissionId}" already exists in system`
                }
            };
        }

        if (duplicateByDetails) {
            return {
                ...student,
                isDuplicate: true,
                errors: {
                    ...student.errors,
                    duplicate: `Similar student already exists in ${student.data.class} with same name and parent phone`
                }
            };
        }

        return student;
    });
};

export const groupStudentsByClassSection = (students) => {
    const groups = {};
    students.forEach(student => {
        const className = student.data.class || 'Unknown Class';
        const section = student.data.section || '';
        const key = section ? `${className} - Section ${section}` : className;

        if (!groups[key]) {
            groups[key] = { className, section, students: [], validCount: 0, invalidCount: 0, duplicateCount: 0 };
        }

        groups[key].students.push(student);

        if (student.isDuplicate) groups[key].duplicateCount++;
        else if (student.valid) groups[key].validCount++;
        else groups[key].invalidCount++;
    });
    return groups;
};

// ─── Import Transformation ────────────────────────────────────────────────────

export const transformStudentForImport = (studentData, allClasses, currentAcademicYear) => {
    const csvClass = studentData.class?.trim() || '';
    const csvSection = studentData.section?.trim() || '';
    const normalizedClass = normalizeClassName(csvClass);

    const matchedClass = allClasses.find(c => {
        if (c.name === csvClass && (c.section || '') === csvSection) return true;
        if (csvClass && c.name === `Class ${csvClass}` && (c.section || '') === csvSection) return true;
        if (normalizedClass && (c.name === normalizedClass || c.name === `Class ${normalizedClass}`) && (c.section || '') === csvSection) return true;
        if (csvClass && c.name.toLowerCase() === csvClass.toLowerCase() && (c.section || '') === csvSection) return true;
        if (normalizedClass && c.name.toLowerCase() === `class ${normalizedClass}`.toLowerCase() && (c.section || '') === csvSection) return true;
        return false;
    });

    if (!matchedClass) {
        throw new Error(
            `Class "${csvClass}"${csvSection ? ` (Section: ${csvSection})` : ''} not found in system. ` +
            `Please create it first or check the spelling. ` +
            `Available classes: ${allClasses.map(c => c.name + (c.section ? `-${c.section}` : '')).join(', ')}`
        );
    }

    return {
        name: studentData.name,
        admissionId: studentData.admissionId,
        academicYear: studentData.academicYear || currentAcademicYear,
        rollNo: studentData.rollNo ? parseInt(studentData.rollNo) : null,
        classId: matchedClass._id,
        gender: studentData.gender || null,
        dateOfBirth: studentData.dateOfBirth || null,
        bloodGroup: studentData.bloodGroup || null,
        nationality: studentData.nationality || null,
        religion: studentData.religion || null,
        category: studentData.category || null,
        motherTongue: studentData.motherTongue || null,
        aadhaarNumber: studentData.aadhaarNumber || null,
        phone: studentData.phone || null,
        email: studentData.email || null,
        address: studentData.address || null,
        city: studentData.city || null,
        state: studentData.state || null,
        zipCode: studentData.zipCode || null,
        whatsappNumber: studentData.whatsappNumber || null,
        parents: studentData.parentName ? [{
            name: studentData.parentName,
            relationship: studentData.parentRelationship || 'Parent',
            phone: studentData.parentPhone,
            email: studentData.parentEmail,
            occupation: studentData.parentOccupation,
            isWhatsapp: true
        }] : undefined,
        emergencyContactName: studentData.emergencyContactName || null,
        emergencyContactPhone: studentData.emergencyContactPhone || null,
        previousSchool: studentData.previousSchool || null,
        medicalConditions: studentData.medicalConditions || null,
        status: 'active',
        feeStatus: 'pending'
    };
};

// ─── Column Definitions ───────────────────────────────────────────────────────

export const ALL_COLUMNS = [
    { key: "name", label: "Student", required: true },
    { key: "class", label: "Class", required: false },
    { key: "parentInfo", label: "Parent Info", required: false },
    { key: "attendance", label: "Attendance", required: false },
    { key: "academicPerformance", label: "Academic Performance", required: false },
    { key: "feeStatus", label: "Fee Status", required: false },
    { key: "actions", label: "Actions", required: true },
];
