# Advanced Fee Settings - Implementation Plan

## Overview

This document outlines the implementation plan for comprehensive fee management settings including collection periods, payment methods, concessions, late fees, and advanced rules.

---

## 🎯 Feature Breakdown

### 1. Collection Period Settings

**Purpose**: Define when and how fees should be collected

**Fields**:
```javascript
{
  collectionInterval: String,  // 'monthly', 'quarterly', 'term-wise', 'yearly'
  installmentPlans: [{
    name: String,              // e.g., "3 Installments"
    frequency: String,         // 'monthly', 'quarterly'
    numberOfInstallments: Number,
    dueDates: [String],        // Array of dates
    enabled: Boolean
  }],
  autoPay: Boolean,
  interestOnDelay: {
    enabled: Boolean,
    type: String,              // 'rate' or 'flat'
    value: Number              // Percentage or flat amount
  }
}
```

**UI Location**: Settings → Fee Rules → Collection Period

---

### 2. Payment Methods Configuration

**Purpose**: Enable/disable payment methods and configure options

**Fields**:
```javascript
{
  paymentMethods: {
    online: {
      enabled: Boolean,
      options: {
        bankTransfer: Boolean,
        upi: Boolean,
        debitCard: Boolean,
        creditCard: Boolean,
        emi: {
          enabled: Boolean,
          providers: [String]  // e.g., ["Bajaj", "HDFC"]
        }
      }
    },
    offline: {
      enabled: Boolean,
      options: {
        cash: Boolean,
        cheque: Boolean,
        dd: Boolean           // Demand Draft
      }
    }
  }
}
```

**UI Location**: Settings → Fee Rules → Payment Methods

---

### 3. Enhanced Fee Heads

**Purpose**: Categorize and configure fee heads with detailed options

**Fields** (Extension of existing FeeHead model):
```javascript
{
  // Existing fields
  name: String,
  amount: Number,
  applicableClasses: [String],
  
  // New fields
  headType: String,          // Predefined categories
  mandatory: Boolean,
  customType: String,        // For custom fee heads
  rules: {
    conditions: [String],    // Special conditions
    defaultApplicable: Boolean
  },
  
  // For Class 11-12
  applicableStreams: [String]  // ['Science', 'Commerce', 'Arts']
}
```

**Head Types**:
- Tuition Fee
- Learning Fee
- Miscellaneous
- Study Materials
- Exam & Development
- Admission Fee
- Transport
- Lab
- Library
- Computer
- Sports
- Extra-Curricular
- Uniforms & ID Cards
- Custom Fee Head

**UI Location**: Settings → Fee Heads (Enhanced)

---

### 4. Concessions/Discounts

**Purpose**: Configure discount schemes for students

**Model**: `FeeConsession`
```javascript
{
  name: String,              // e.g., "Sibling Discount"
  discountType: String,      // 'percentage' or 'flat'
  discountValue: Number,
  applicableOn: String,      // 'selected_heads', 'entire_fee'
  applicableFeeHeads: [ObjectId],  // If selected_heads
  
  approvalRequired: Boolean,
  approverRole: String,      // 'principal', 'admin', etc.
  
  eligibilityCriteria: {
    type: String,            // 'sibling', 'merit', 'financial', 'custom'
    conditions: [String]
  },
  
  academicYear: String,
  isActive: Boolean
}
```

**UI Location**: Settings → Fee Rules → Concessions

---

### 5. Late Fee Fine Rules

**Purpose**: Automatically calculate and apply late fees

**Model**: `LateFeeRule`
```javascript
{
  enabled: Boolean,
  gracePeriod: Number,       // Days after due date
  
  fineType: String,          // 'per_day', 'slab', 'flat'
  
  // For per_day
  perDayAmount: Number,
  
  // For slab
  slabs: [{
    fromDay: Number,
    toDay: Number,
    amount: Number
  }],
  
  // For flat
  flatAmount: Number,
  
  maximumCap: Number,        // Optional max late fee
  
  applicableFeeHeads: [ObjectId],  // Which fee heads
  academicYear: String
}
```

**Example Slabs**:
- 1-7 days: ₹100
- 8-15 days: ₹200
- 16-30 days: ₹500
- 30+ days: ₹1000

**UI Location**: Settings → Fee Rules → Late Fee Rules

---

### 6. Fee Rules

**Purpose**: Define rules for fee calculation and application

**Model**: `FeeRule`
```javascript
{
  newAdmission: {
    feeCalculation: String,  // 'total' or 'prorated'
    prorateFrom: String,     // 'admission_date', 'month_start'
  },
  
  validTill: {
    type: String,            // 'academic_year', 'specific_date'
    date: String             // If specific_date
  },
  
  editApprovalControls: {
    feeHeadEdit: {
      requiresApproval: Boolean,
      approverRole: String
    },
    concessionApproval: {
      requiresApproval: Boolean,
      approverRole: String
    },
    feeWaiver: {
      requiresApproval: Boolean,
      approverRole: String,
      maxAmount: Number      // Max waiver without approval
    }
  },
  
  academicYear: String
}
```

**UI Location**: Settings → Fee Rules → General Rules

---

## 📋 Implementation Phases

### Phase 1: Database Models (Backend)

**Files to Create/Update**:

1. **`backend/models/FeeCollectionPeriod.js`**
```javascript
import mongoose from 'mongoose';

const feeCollectionPeriodSchema = new mongoose.Schema({
  academicYear: { type: String, required: true },
  collectionInterval: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'term-wise', 'yearly'],
    default: 'yearly'
  },
  installmentPlans: [{
    name: String,
    frequency: String,
    numberOfInstallments: Number,
    dueDates: [String],
    enabled: { type: Boolean, default: true }
  }],
  autoPay: { type: Boolean, default: false },
  interestOnDelay: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['rate', 'flat'] },
    value: Number
  }
}, { timestamps: true });

export default mongoose.model('FeeCollectionPeriod', feeCollectionPeriodSchema);
```

2. **`backend/models/PaymentMethodConfig.js`**
```javascript
import mongoose from 'mongoose';

const paymentMethodConfigSchema = new mongoose.Schema({
  academicYear: { type: String, required: true },
  online: {
    enabled: { type: Boolean, default: true },
    bankTransfer: { type: Boolean, default: true },
    upi: { type: Boolean, default: true },
    debitCard: { type: Boolean, default: true },
    creditCard: { type: Boolean, default: true },
    emi: {
      enabled: { type: Boolean, default: false },
      providers: [String]
    }
  },
  offline: {
    enabled: { type: Boolean, default: true },
    cash: { type: Boolean, default: true },
    cheque: { type: Boolean, default: true },
    dd: { type: Boolean, default: true }
  }
}, { timestamps: true });

export default mongoose.model('PaymentMethodConfig', paymentMethodConfigSchema);
```

3. **`backend/models/FeeConsession.js`**
```javascript
import mongoose from 'mongoose';

const feeConcessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  discountType: { 
    type: String, 
    enum: ['percentage', 'flat'],
    required: true 
  },
  discountValue: { type: Number, required: true },
  applicableOn: { 
    type: String, 
    enum: ['selected_heads', 'entire_fee'],
    default: 'entire_fee'
  },
  applicableFeeHeads: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FeeHead' 
  }],
  
  approvalRequired: { type: Boolean, default: false },
  approverRole: String,
  
  eligibilityCriteria: {
    type: { 
      type: String, 
      enum: ['sibling', 'merit', 'financial', 'staff_ward', 'custom']
    },
    conditions: [String]
  },
  
  academicYear: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('FeeConsession', feeConcessionSchema);
```

4. **`backend/models/LateFeeRule.js`**
```javascript
import mongoose from 'mongoose';

const lateFeeRuleSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  gracePeriod: { type: Number, default: 0 },
  
  fineType: { 
    type: String, 
    enum: ['per_day', 'slab', 'flat'],
    required: true 
  },
  
  perDayAmount: Number,
  
  slabs: [{
    fromDay: Number,
    toDay: Number,
    amount: Number
  }],
  
  flatAmount: Number,
  
  maximumCap: Number,
  
  applicableFeeHeads: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FeeHead' 
  }],
  
  academicYear: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('LateFeeRule', lateFeeRuleSchema);
```

5. **`backend/models/FeeRule.js`**
```javascript
import mongoose from 'mongoose';

const feeRuleSchema = new mongoose.Schema({
  academicYear: { type: String, required: true },
  
  newAdmission: {
    feeCalculation: { 
      type: String, 
      enum: ['total', 'prorated'],
      default: 'total'
    },
    prorateFrom: { 
      type: String, 
      enum: ['admission_date', 'month_start'],
      default: 'admission_date'
    }
  },
  
  validTill: {
    type: { 
      type: String, 
      enum: ['academic_year', 'specific_date'],
      default: 'academic_year'
    },
    date: String
  },
  
  editApprovalControls: {
    feeHeadEdit: {
      requiresApproval: { type: Boolean, default: true },
      approverRole: String
    },
    concessionApproval: {
      requiresApproval: { type: Boolean, default: true },
      approverRole: String
    },
    feeWaiver: {
      requiresApproval: { type: Boolean, default: true },
      approverRole: String,
      maxAmount: Number
    }
  }
}, { timestamps: true });

export default mongoose.model('FeeRule', feeRuleSchema);
```

6. **Update `backend/models/FeeHead.js`**
```javascript
// Add new fields
headType: { 
  type: String, 
  enum: [
    'tuition', 'learning', 'miscellaneous', 'study_materials',
    'exam_development', 'admission', 'transport', 'lab',
    'library', 'computer', 'sports', 'extra_curricular',
    'uniforms_id', 'custom'
  ],
  default: 'tuition'
},
customType: String,
applicableStreams: [String],  // For class 11-12
rules: {
  conditions: [String],
  defaultApplicable: { type: Boolean, default: true }
}
```

---

### Phase 2: Backend Routes

**Files to Create**:

1. **`backend/routes/feeSettings.js`**
```javascript
import express from 'express';
import FeeCollectionPeriod from '../models/FeeCollectionPeriod.js';
import PaymentMethodConfig from '../models/PaymentMethodConfig.js';
import FeeConsession from '../models/FeeConsession.js';
import LateFeeRule from '../models/LateFeeRule.js';
import FeeRule from '../models/FeeRule.js';

const router = express.Router();

// Collection Period
router.get('/collection-period', async (req, res) => { /* ... */ });
router.post('/collection-period', async (req, res) => { /* ... */ });
router.put('/collection-period/:id', async (req, res) => { /* ... */ });

// Payment Methods
router.get('/payment-methods', async (req, res) => { /* ... */ });
router.post('/payment-methods', async (req, res) => { /* ... */ });
router.put('/payment-methods/:id', async (req, res) => { /* ... */ });

// Concessions
router.get('/concessions', async (req, res) => { /* ... */ });
router.post('/concessions', async (req, res) => { /* ... */ });
router.put('/concessions/:id', async (req, res) => { /* ... */ });
router.delete('/concessions/:id', async (req, res) => { /* ... */ });

// Late Fee Rules
router.get('/late-fee-rules', async (req, res) => { /* ... */ });
router.post('/late-fee-rules', async (req, res) => { /* ... */ });
router.put('/late-fee-rules/:id', async (req, res) => { /* ... */ });

// General Rules
router.get('/rules', async (req, res) => { /* ... */ });
router.post('/rules', async (req, res) => { /* ... */ });
router.put('/rules/:id', async (req, res) => { /* ... */ });

export default router;
```

2. **Mount in `backend/server.js`**
```javascript
import feeSettingsRoutes from './routes/feeSettings.js';
app.use('/api/fee-settings', feeSettingsRoutes);
```

---

### Phase 3: Frontend UI Components

**Files to Create/Update**:

1. **`school-dashboard/src/pages/settings/FeeRulesSettings.jsx`**

Main settings page with tabs:
- Collection Period
- Payment Methods
- Concessions
- Late Fee Rules
- General Rules

2. **Update `school-dashboard/src/pages/settings/FeeHeadsSettings.jsx`**

Add new fields:
- Head Type dropdown
- Stream selection for Class 11-12
- Rules/Conditions
- Default Applicable toggle

3. **Update Settings Navigation**

Add "Fee Rules" to settings menu

---

### Phase 4: Business Logic Integration

**Features to Implement**:

1. **Prorated Fee Calculation**
   - Calculate fees based on admission date
   - Apply to new admissions automatically

2. **Late Fee Auto-Calculation**
   - Check due dates daily
   - Calculate late fees based on rules
   - Add to student balance

3. **Concession Application**
   - Apply discounts to eligible students
   - Require approval if configured
   - Track concession history

4. **Installment Management**
   - Generate installment schedule
   - Track installment payments
   - Send reminders before due dates

5. **Payment Method Validation**
   - Check enabled methods before payment
   - Show only enabled options in UI

---

## 🎨 UI Mockup Structure

### Settings → Fee Rules

```
┌─────────────────────────────────────────────────────────┐
│  Fee Rules & Configuration                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Collection Period] [Payment Methods] [Concessions]    │
│  [Late Fee Rules] [General Rules]                       │
│                                                          │
│  ┌─ Collection Period ─────────────────────────────┐   │
│  │                                                   │   │
│  │  Collection Interval: [Yearly ▼]                │   │
│  │                                                   │   │
│  │  Installment Plans:                              │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │ 3 Installments - Quarterly              │   │   │
│  │  │ Due: Apr 1, Jul 1, Oct 1      [Edit]    │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  │  [+ Add Installment Plan]                       │   │
│  │                                                   │   │
│  │  Auto-Pay: [OFF]                                │   │
│  │                                                   │   │
│  │  Interest on Delay: [ON]                        │   │
│  │  Type: [Rate ▼]  Value: [2] % per month        │   │
│  │                                                   │   │
│  │  [Save Changes]                                  │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Summary

```
FeeCollectionPeriod
├── collectionInterval
├── installmentPlans[]
├── autoPay
└── interestOnDelay

PaymentMethodConfig
├── online
│   ├── enabled
│   ├── bankTransfer
│   ├── upi
│   ├── cards
│   └── emi
└── offline
    ├── cash
    ├── cheque
    └── dd

FeeConsession
├── name
├── discountType
├── discountValue
├── applicableOn
├── approvalRequired
└── eligibilityCriteria

LateFeeRule
├── enabled
├── gracePeriod
├── fineType
├── slabs[]
└── maximumCap

FeeRule
├── newAdmission
├── validTill
└── editApprovalControls

FeeHead (Enhanced)
├── headType
├── applicableStreams
└── rules
```

---

## ✅ Implementation Checklist

### Backend
- [ ] Create FeeCollectionPeriod model
- [ ] Create PaymentMethodConfig model
- [ ] Create FeeConsession model
- [ ] Create LateFeeRule model
- [ ] Create FeeRule model
- [ ] Update FeeHead model with new fields
- [ ] Create feeSettings routes
- [ ] Implement CRUD operations for all models
- [ ] Add validation logic
- [ ] Implement late fee calculation logic
- [ ] Implement prorated fee calculation
- [ ] Implement concession application logic

### Frontend
- [ ] Create FeeRulesSettings component
- [ ] Create Collection Period tab
- [ ] Create Payment Methods tab
- [ ] Create Concessions tab
- [ ] Create Late Fee Rules tab
- [ ] Create General Rules tab
- [ ] Update FeeHeadsSettings with new fields
- [ ] Add stream selection for Class 11-12
- [ ] Integrate with backend APIs
- [ ] Add form validation
- [ ] Add success/error notifications

### Integration
- [ ] Apply late fees automatically
- [ ] Calculate prorated fees for new admissions
- [ ] Apply concessions to eligible students
- [ ] Validate payment methods
- [ ] Generate installment schedules
- [ ] Send payment reminders

---

## 🚀 Estimated Timeline

- **Phase 1 (Backend Models)**: 2-3 days
- **Phase 2 (Backend Routes)**: 2-3 days
- **Phase 3 (Frontend UI)**: 4-5 days
- **Phase 4 (Business Logic)**: 3-4 days
- **Testing & Refinement**: 2-3 days

**Total**: 13-18 days

---

## 📝 Notes

1. This is a comprehensive enhancement that significantly expands the fee management system
2. Each feature should be implemented and tested incrementally
3. Backward compatibility should be maintained with existing fee structures
4. Consider creating a migration script for existing data
5. Add comprehensive documentation for each feature
6. Implement proper error handling and validation
7. Add audit logs for all fee-related changes

---

## 🎯 Priority Order

1. **High Priority**:
   - Enhanced Fee Heads (with head types)
   - Payment Methods Configuration
   - Late Fee Rules

2. **Medium Priority**:
   - Concessions/Discounts
   - Collection Period Settings
   - General Rules

3. **Low Priority**:
   - Auto-pay
   - Interest on delay
   - Advanced approval workflows

---

This implementation plan provides a complete roadmap for building a comprehensive fee management system with all the requested features.
