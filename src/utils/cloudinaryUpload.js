const CLOUD_NAME = 'dfpa7yhjh';
const UPLOAD_PRESET = 'Bluecare_Pharma';

/**
 * Upload an image file to Cloudinary using unsigned upload.
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to upload image');
  }

  const data = await response.json();
  return data.secure_url;
};
