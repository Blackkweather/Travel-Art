import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';
import { apiClient } from '@/utils/api';
import { normalizeImageUrl } from '@/utils/imageUrl';
import toast from 'react-hot-toast';
import { t } from '@/i18n'

interface ProfilePictureUploadProps {
  currentImage?: string;
  onUploadSuccess: (imageUrl: string) => void;
  role: 'ARTIST' | 'HOTEL';
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImage,
  onUploadSuccess,
  role
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('Sélectionnez un fichier image'));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('L’image doit faire moins de 5 Mo'));
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      console.log('📤 Starting upload...', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type 
      });
      
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      // Verify FormData contents
      console.log('📦 FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? {
          name: value.name,
          size: value.size,
          type: value.type
        } : value);
      }

      // Use apiClient which automatically handles authentication
      // The interceptor will handle FormData correctly (no Content-Type header)
      const response = await apiClient.post('/upload/profile-picture', formData);
      
      console.log('✅ Upload successful:', response.data);
      const imageUrl = response.data.data.url;
      
      // Call the success callback FIRST - this updates the parent's state
      onUploadSuccess(imageUrl);
      
      // Then clear preview after a short delay to allow parent to update
      // The parent will pass the new imageUrl as currentImage prop
      setTimeout(() => {
        setPreview(null);
      }, 100);
      
      toast.success(t('Photo de profil enregistrée'));
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      toast.error(error.response?.data?.message || error.message || 'Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Use preview during upload, then fall back to currentImage
  // If we just uploaded, use the currentImage (which should be updated by parent)
  const displayImage = preview || (currentImage ? normalizeImageUrl(currentImage) : null);

  return (
    <div className="relative inline-block">
      <div className="relative w-48 h-48 rounded-card overflow-hidden bg-surface-sunken border-2 border-line">
        {displayImage ? (
          <img decoding="async" loading="lazy"
            src={displayImage}
            alt={t('Profil')}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy/10 to-gold/10">
            <Camera className="w-16 h-16 text-content-secondary" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <div className="absolute bottom-2 right-2 flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          disabled={uploading}
          className="bg-gold text-navy p-2 rounded-full hover:bg-gold/90 transition-colors shadow-lg disabled:opacity-50"
          title={t('Changer la photo')}
        >
          <Upload className="w-4 h-4" />
        </button>

        {preview && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemove();
            }}
            className="bg-[var(--state-critical)] text-white p-2 rounded-full hover:bg-[var(--state-critical)] transition-colors shadow-lg"
            title={t('Retirer')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePictureUpload;




