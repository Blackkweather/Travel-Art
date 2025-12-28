import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';
import axios from 'axios';
import { getClerkToken } from '@/utils/clerkToken';
import toast from 'react-hot-toast';

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
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
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
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = await getClerkToken()
      const response = await axios.post('/api/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const imageUrl = response.data.data.url;
      onUploadSuccess(imageUrl);
      toast.success('Profile picture uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
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

  const displayImage = preview || currentImage;

  return (
    <div className="relative inline-block">
      <div className="relative w-48 h-48 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
        {displayImage ? (
          <img
            src={displayImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy/10 to-gold/10">
            <Camera className="w-16 h-16 text-gray-400" />
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
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-gold text-navy p-2 rounded-full hover:bg-gold/90 transition-colors shadow-lg disabled:opacity-50"
          title="Upload new photo"
        >
          <Upload className="w-4 h-4" />
        </button>

        {preview && !uploading && (
          <button
            onClick={handleRemove}
            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePictureUpload;




