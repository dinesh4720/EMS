# Student Admission Drawer - Implementation Status

## ✅ COMPLETED

### Backend Implementation
1. **Database Schema** (backend/database.js)
   - ✅ Added `AdmissionFormConfig` schema for field configuration
   - ✅ Added `AdmissionIdConfig` schema for admission ID format
   - ✅ Added `DocumentConfig` schema for document requirements
   - ✅ Created `getNextAdmissionId()` helper function with auto-generation logic

2. **API Endpoints** (backend/server.js)
   - ✅ GET `/api/settings/admission-form-config` - Get field configurations
   - ✅ POST `/api/settings/admission-form-config` - Create/update field config
   - ✅ PUT `/api/settings/admission-form-config/bulk` - Bulk update configs
   - ✅ DELETE `/api/settings/admission-form-config/:id` - Delete config
   - ✅ GET `/api/settings/admission-id-config` - Get admission ID config
   - ✅ PUT `/api/settings/admission-id-config` - Update admission ID config
   - ✅ POST `/api/settings/admission-id-config/preview` - Preview admission ID
   - ✅ GET `/api/settings/document-config` - Get document configs
   - ✅ POST `/api/settings/document-config` - Create document config
   - ✅ PUT `/api/settings/document-config/:id` - Update document config
   - ✅ PUT `/api/settings/document-config/bulk` - Bulk update document configs
   - ✅ DELETE `/api/settings/document-config/:id` - Delete document config
   - ✅ GET `/api/students/next-admission-id` - Generate next admission ID

3. **API Service** (school-dashboard/src/services/api.js)
   - ✅ Added all admission configuration API methods to `settingsApi`
   - ✅ Added `getNextAdmissionId()` to `studentsApi`

4. **Settings Page** (school-dashboard/src/pages/settings/AdmissionFormSettings.jsx)
   - ✅ Created complete settings page with two tabs:
     - Admission ID Format configuration
     - Document Requirements configuration
   - ✅ Live preview of admission ID format
   - ✅ Configurable prefix, year format, separator, padding, reset frequency
   - ✅ Document upload type (single/multiple/front-back)
   - ✅ Required/optional document marking
   - ✅ File size and format configuration
   - ✅ Save and reset functionality

5. **Settings Navigation**
   - ✅ Added "Admission Form" to settings menu
   - ✅ Integrated route in settings index

---

## 🚧 TODO - Drawer UI Improvements

### Phase 1: Critical Fixes (Needs Implementation in AddStudent.jsx)

1. **Drawer Width & Styling**
   ```jsx
   // In school-dashboard/src/pages/students/index.jsx
   // Change drawer size from "lg" to "xl" or custom width
   <Drawer size="xl"> // or size="full" for maximum width
   ```

2. **Padding Adjustments**
   ```jsx
   // Adjust DrawerBody padding
   <DrawerBody className="p-8 overflow-y-auto"> // Increase from p-6 to p-8
   ```

3. **Replace Dashed Lines with Solid Lines**
   ```jsx
   // In AddStudent.jsx, find all instances of:
   border-dashed border-gray-200
   // Replace with:
   border-solid border-gray-200
   ```

4. **Photo Upload Button Logic**
   ```jsx
   // In renderStep1(), update delete button visibility:
   {formData.picture && (
     <button
       className="text-sm font-semibold text-danger hover:text-danger-600"
       onClick={() => updateField("picture", null)}
     >
       Delete
     </button>
   )}
   ```

5. **Change "Upload Photo" to "Change Photo"**
   ```jsx
   // In renderStep1():
   <button onClick={() => pictureInputRef.current?.click()}>
     {formData.picture ? "Change Photo" : "Upload Photo"}
   </button>
   ```

6. **Auto-scroll to Top on Step Change**
   ```jsx
   // Add ref for scroll container
   const scrollContainerRef = useRef(null);
   
   // In handleNext():
   const handleNext = () => {
     if (validateStep(step)) {
       setStep(prev => Math.min(prev + 1, 3));
       scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
     }
   };
   
   // Apply ref to DrawerBody
   <DrawerBody ref={scrollContainerRef} className="p-8 overflow-y-auto">
   ```

### Phase 2: Field Management

1. **Remove Unnecessary Fields**
   - ✅ Medium field - Already optional
   - ✅ House field - Already optional
   - ❌ Remove Alternate Contact (or add relationship dropdown)
   - ❌ Remove Emergency Contact section

2. **Make DOB & Gender Mandatory**
   ```jsx
   // In validateStep(1):
   if (!formData.dateOfBirth) newErrors.dateOfBirth = "Required";
   if (!formData.gender) newErrors.gender = "Required";
   
   // Add isRequired prop to inputs
   <Input isRequired label="Date of Birth" ... />
   ```

3. **Admission ID Auto-generation**
   ```jsx
   // Add useEffect to fetch next admission ID
   useEffect(() => {
     const fetchNextAdmissionId = async () => {
       try {
         const response = await studentsApi.getNextAdmissionId();
         updateField("admissionId", response.admissionId);
       } catch (error) {
         console.error('Error fetching admission ID:', error);
       }
     };
     fetchNextAdmissionId();
   }, []);
   ```

4. **Roll Number Auto-fill**
   ```jsx
   // Add logic to auto-fill based on class selection
   useEffect(() => {
     if (formData.class) {
       // Fetch students in class and suggest next roll number
       // Implementation depends on your roll number logic
     }
   }, [formData.class]);
   ```

### Phase 3: Parent/Guardian Section

1. **Change Button Style**
   ```jsx
   // Change from filled button to link button:
   <Button size="sm" variant="light" color="primary" onPress={addParent}>
     <Plus size={14} /> Add Another Parent
   </Button>
   ```

2. **Update Checkbox Label**
   ```jsx
   // Change from "Same as WhatsApp" to "Same for WhatsApp"
   <Checkbox>Same for WhatsApp</Checkbox>
   ```

3. **Add Parent/Guardian Toggle**
   ```jsx
   // Add at the top of parent section:
   <RadioGroup
     label="Relationship Type"
     value={parent.relationshipType}
     onValueChange={v => updateParent(index, "relationshipType", v)}
   >
     <Radio value="parent">Parent</Radio>
     <Radio value="guardian">Guardian</Radio>
   </RadioGroup>
   
   // Update section title dynamically:
   <span className="text-sm font-medium text-gray-700">
     {parent.relationshipType === 'guardian' ? 'Guardian' : 'Parent'} {index + 1}
   </span>
   ```

### Phase 4: Document Upload

1. **Enable Multiple File Uploads**
   ```jsx
   // Change file input to accept multiple:
   <input type="file" multiple accept="..." />
   
   // Update handler:
   const handleMultiFileUpload = (field, files) => {
     const fileArray = Array.from(files);
     updateField(field, [...(formData[field] || []), ...fileArray]);
   };
   ```

2. **Front & Back Upload**
   ```jsx
   // Add separate inputs for front and back:
   <div className="grid grid-cols-2 gap-4">
     <div>
       <label>Front Side</label>
       <input ref={frontRef} type="file" ... />
     </div>
     <div>
       <label>Back Side</label>
       <input ref={backRef} type="file" ... />
     </div>
   </div>
   ```

3. **Load Document Config from Settings**
   ```jsx
   // Add state and useEffect:
   const [documentConfig, setDocumentConfig] = useState([]);
   
   useEffect(() => {
     const loadDocConfig = async () => {
       const config = await settingsApi.getDocumentConfig();
       setDocumentConfig(config);
     };
     loadDocConfig();
   }, []);
   
   // Render documents dynamically based on config:
   {documentConfig.map((doc, index) => (
     <div key={index}>
       <label>
         {doc.documentName}
         {doc.isRequired && <span className="text-danger">*</span>}
       </label>
       {doc.description && <p className="text-xs text-gray-500">{doc.description}</p>}
       {/* Render upload based on doc.uploadType */}
     </div>
   ))}
   ```

4. **Fix Cancel Button Behavior**
   ```jsx
   // Update cancel button to actually remove the file:
   const handleCancelUpload = (field) => {
     updateField(field, null);
     // Reset file input
     if (field === 'birthCertificate') birthCertRef.current.value = '';
     // ... repeat for other fields
   };
   ```

5. **Add Skip & Upload Later**
   ```jsx
   // Add button in step 3:
   <Button variant="flat" onPress={() => {
     // Skip validation for step 3
     handleSubmit();
   }}>
     Skip & Upload Later
   </Button>
   ```

### Phase 5: Final Actions

1. **Fix "Add Student" Button**
   - The button is already implemented in `handleSubmit()`
   - Need to verify the API call is working correctly
   - Check console for any errors during submission

2. **Remove Duplicate Close Icons**
   ```jsx
   // In school-dashboard/src/pages/students/index.jsx
   // Ensure only one close button in DrawerHeader
   <DrawerHeader className="border-b border-default-200 px-6 py-4 flex justify-between items-center">
     <div className="flex items-center gap-3">
       {/* Title content */}
     </div>
     <Button isIconOnly size="sm" variant="light" onPress={handleCloseAddStudent}>
       <X size={20} className="text-default-500" />
     </Button>
   </DrawerHeader>
   ```

---

## 📝 Quick Implementation Guide

### To implement the remaining changes:

1. **Open** `school-dashboard/src/pages/students/AddStudent.jsx`
2. **Apply** the code changes listed above in order
3. **Test** each change individually
4. **Verify** the drawer works correctly with the new settings

### Testing Checklist:

- [ ] Drawer opens with increased width
- [ ] Padding looks better
- [ ] Lines are solid instead of dashed
- [ ] Photo delete button only shows when photo is uploaded
- [ ] "Upload Photo" changes to "Change Photo" after upload
- [ ] DOB and Gender are mandatory
- [ ] Admission ID auto-generates from settings
- [ ] Scroll to top works when clicking Next
- [ ] Parent/Guardian toggle works
- [ ] Document uploads work with new configuration
- [ ] Skip & Upload Later button works
- [ ] Add Student button creates student successfully
- [ ] Only one close icon is visible

---

## 🎯 Priority Order

1. **High Priority** (Do First)
   - Fix Add Student button functionality
   - Increase drawer width
   - Make DOB & Gender mandatory
   - Auto-generate Admission ID
   - Remove duplicate close icons

2. **Medium Priority**
   - Auto-scroll to top
   - Photo upload button text change
   - Parent/Guardian toggle
   - Load document config from settings

3. **Low Priority** (Polish)
   - Button style changes
   - Checkbox label updates
   - Supporting text for documents

---

**Status:** Backend and Settings are 100% complete. Frontend drawer improvements are documented and ready for implementation.

**Next Steps:** Apply the changes listed in the TODO sections to AddStudent.jsx and test thoroughly.
