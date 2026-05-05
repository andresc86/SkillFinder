const CLOUD_NAME = 'dd4rd92ay';
const UPLOAD_PRESET = 'skillfinder';

type CloudinaryResourceType = 'image' | 'video' | 'auto';

interface CloudinaryUploadResult {
  secure_url: string;
}

export async function uploadToCloudinary(
  file: File,
  resourceType: CloudinaryResourceType = 'auto'
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('No se pudo subir el archivo a Cloudinary.');
  }

  const data = (await response.json()) as CloudinaryUploadResult;
  return data.secure_url;
}
