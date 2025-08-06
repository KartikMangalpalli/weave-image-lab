import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageUpload: (file: File, imageData: ImageData) => void;
  uploadedImage: File | null;
}

export const ImageUpload = ({ onImageUpload, uploadedImage }: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/bmp', 'image/x-ms-bmp', 'image/jpeg', 'image/jpg', 'image/png'];
    
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.bmp')) {
      toast.error("Please upload a BMP, JPEG, or PNG image file");
      return false;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 50MB");
      return false;
    }

    return true;
  };

  const processImageFile = async (file: File) => {
    if (!validateFile(file)) return;

    try {
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);

      // Create image element to load the file
      const img = new Image();
      img.onload = () => {
        // Create canvas to extract image data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          toast.error("Failed to process image");
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        onImageUpload(file, imageData);
        toast.success(`Image uploaded: ${img.width}×${img.height} pixels`);
        
        // Clean up
        URL.revokeObjectURL(imageUrl);
      };

      img.onerror = () => {
        toast.error("Failed to load image file");
        URL.revokeObjectURL(imageUrl);
      };

      img.src = imageUrl;
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image file");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Upload Image
          </CardTitle>
          <CardDescription>
            Upload a BMP, JPEG, or PNG image to apply pixel reordering patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".bmp,.jpg,.jpeg,.png,image/bmp,image/jpeg,image/png"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 rounded border shadow-sm"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={clearImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {uploadedImage && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">{uploadedImage.name}</p>
                    <p>{(uploadedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium text-foreground">
                    Drop your image here, or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports BMP, JPEG, and PNG files up to 50MB
                  </p>
                </div>
                <Button variant="outline">
                  Browse Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};