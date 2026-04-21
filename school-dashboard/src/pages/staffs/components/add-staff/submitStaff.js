import { isAllowedDocumentUrl } from "../../../../utils/validations";
import logger from "../../../../utils/logger";
import toast from "react-hot-toast";

/**
 * Handles all file uploads and submits the staff form data.
 * Returns the saved staff document on success, or throws on failure.
 */
export const submitStaffForm = async ({ formData, onSave }) => {
  const { uploadApi } = await import("../../../../services/api");

  // Upload profile picture to Cloudinary if it's a File object
  let pictureUrl = null;
  if (formData.picture instanceof File) {
    try {
      const uploadResponse = await uploadApi.uploadFile(formData.picture);
      pictureUrl = uploadResponse.url;
    } catch (error) {
      logger.error('❌ Photo upload failed:', error);
      toast.error('Photo upload failed: ' + (error.message || 'Unknown error'));
      // Continue without photo
    }
  } else if (typeof formData.picture === 'string' && formData.picture.length > 0) {
    if (!isAllowedDocumentUrl(formData.picture)) {
      logger.error('❌ Picture URL from disallowed domain:', formData.picture);
    } else {
      pictureUrl = formData.picture;
    }
  }

  // Upload ID documents to Cloudinary
  const uploadedIdDocuments = [];
  for (const doc of formData.idDocuments) {
    if (doc.file instanceof File) {
      try {
        const uploadResponse = await uploadApi.uploadFile(doc.file);
        uploadedIdDocuments.push({
          type: doc.type,
          url: uploadResponse.url,
          name: doc.name
        });
      } catch (error) {
        logger.error(`❌ ${doc.type} upload failed:`, error);
      }
    } else if (doc.url) {
      if (!isAllowedDocumentUrl(doc.url)) {
        logger.error('❌ ID document URL from disallowed domain:', doc.url);
      } else {
        uploadedIdDocuments.push(doc);
      }
    }
  }

  // Upload qualification documents
  const uploadedQualificationDocs = [];
  for (const file of formData.qualificationDocs) {
    if (file instanceof File) {
      try {
        const uploadResponse = await uploadApi.uploadFile(file);
        uploadedQualificationDocs.push(uploadResponse.url);
      } catch (error) {
        logger.error('❌ Qualification doc upload failed:', error);
      }
    } else if (typeof file === 'string') {
      if (!isAllowedDocumentUrl(file)) {
        logger.error('❌ Qualification doc URL from disallowed domain:', file);
      } else {
        uploadedQualificationDocs.push(file);
      }
    }
  }

  // Upload documents within professional qualifications
  const uploadedProfessionalQualifications = await Promise.all(
    (formData.professionalQualifications || []).map(async (qual) => {
      const uploadedDocs = [];
      for (const doc of qual.documents || []) {
        if (doc instanceof File) {
          try {
            const uploadResponse = await uploadApi.uploadFile(doc);
            uploadedDocs.push(uploadResponse.url);
          } catch (error) {
            logger.error('❌ Professional qualification doc upload failed:', error);
          }
        } else if (typeof doc === 'string') {
          if (!isAllowedDocumentUrl(doc)) {
            logger.error('❌ Professional qualification doc URL from disallowed domain:', doc);
          } else {
            uploadedDocs.push(doc);
          }
        }
      }
      return {
        name: qual.name,
        year: qual.year,
        documents: uploadedDocs
      };
    })
  );

  // Upload custom documents
  const uploadedCustomDocuments = [];
  for (const file of formData.customDocuments || []) {
    if (file instanceof File) {
      try {
        const uploadResponse = await uploadApi.uploadFile(file);
        uploadedCustomDocuments.push(uploadResponse.url);
      } catch (error) {
        logger.error('❌ Custom document upload failed:', error);
      }
    } else if (typeof file === 'string') {
      if (!isAllowedDocumentUrl(file)) {
        logger.error('❌ Custom document URL from disallowed domain:', file);
      } else {
        uploadedCustomDocuments.push(file);
      }
    }
  }

  // Prepare staff data with uploaded URLs
  const staffData = {
    ...formData,
    picture: pictureUrl,
    idDocuments: uploadedIdDocuments,
    qualificationDocs: uploadedQualificationDocs,
    professionalQualifications: uploadedProfessionalQualifications,
    customDocuments: uploadedCustomDocuments,
  };

  // Calculate total salary from salaryBreakdown for payroll
  if (formData.salaryBreakdown && formData.salaryBreakdown.length > 0) {
    const totalSalary = formData.salaryBreakdown.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
    staffData.salary = totalSalary;
  }

  // Filter out empty emergency contacts and strip internal _key field
  if (staffData.emergencyContacts) {
    staffData.emergencyContacts = staffData.emergencyContacts
      .filter(contact => contact.name?.trim() || contact.relationship?.trim() || contact.phone?.trim())
      .map(({ _key, ...rest }) => rest);
    if (staffData.emergencyContacts.length === 0) {
      delete staffData.emergencyContacts;
    }
  }

  // Remove undefined values and unwanted fields
  Object.keys(staffData).forEach(key => {
    if (staffData[key] === undefined || staffData[key] === null) {
      delete staffData[key];
    }
  });

  // Remove staffId if it exists (not a valid field in schema)
  delete staffData.staffId;

  // Save staff and get the response
  const savedStaff = await onSave(staffData);
  return { savedStaff, staffData };
};
