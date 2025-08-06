import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Wand2, Eye } from "lucide-react";
import { toast } from "sonner";
import type { PixelSection } from "@/lib/supabase";

interface ImageProcessorProps {
  originalImage: File | null;
  originalImageData: ImageData | null;
  selectedSection: PixelSection | null;
}

export const ImageProcessor = ({ originalImage, originalImageData, selectedSection }: ImageProcessorProps) => {
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const processImage = async () => {
    if (!originalImageData || !selectedSection) {
      toast.error("Please upload an image and select a pattern section");
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const { width, height, data } = originalImageData;
      const sectionSize = selectedSection.size;
      const pattern = selectedSection.pattern;

      // Create new image data
      const newImageData = new ImageData(width, height);
      const newData = newImageData.data;

      // Copy original data first
      for (let i = 0; i < data.length; i++) {
        newData[i] = data[i];
      }

      // Process image in vertical sections
      const numCompleteSlices = Math.floor(width / sectionSize);
      
      for (let slice = 0; slice < numCompleteSlices; slice++) {
        const sliceStartX = slice * sectionSize;
        
        // For each row in this slice
        for (let y = 0; y < height; y++) {
          // Store original pixel data for this row of the slice
          const originalRowData: number[][] = [];
          
          for (let x = 0; x < sectionSize; x++) {
            const pixelIndex = ((y * width) + (sliceStartX + x)) * 4;
            originalRowData[x] = [
              data[pixelIndex],     // R
              data[pixelIndex + 1], // G
              data[pixelIndex + 2], // B
              data[pixelIndex + 3]  // A
            ];
          }
          
          // Apply the reordering pattern
          for (let x = 0; x < sectionSize; x++) {
            const sourceColumn = pattern[x] - 1; // Convert to 0-based index
            const targetPixelIndex = ((y * width) + (sliceStartX + x)) * 4;
            
            // Copy pixels according to pattern
            newData[targetPixelIndex] = originalRowData[sourceColumn][0];     // R
            newData[targetPixelIndex + 1] = originalRowData[sourceColumn][1]; // G
            newData[targetPixelIndex + 2] = originalRowData[sourceColumn][2]; // B
            newData[targetPixelIndex + 3] = originalRowData[sourceColumn][3]; // A
          }
        }
        
        // Update progress
        setProgress(((slice + 1) / numCompleteSlices) * 100);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      setProcessedImageData(newImageData);
      
      // Create preview
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.putImageData(newImageData, 0, 0);
        const url = canvas.toDataURL('image/png');
        setPreviewUrl(url);
      }

      toast.success("Image processing completed!");
      
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const downloadImage = (format: 'png' | 'jpg' | 'bmp') => {
    if (!processedImageData || !originalImage) {
      toast.error("No processed image to download");
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = processedImageData.width;
    canvas.height = processedImageData.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      toast.error("Failed to create download canvas");
      return;
    }

    ctx.putImageData(processedImageData, 0, 0);
    
    // Get the appropriate MIME type and extension
    let mimeType: string;
    let extension: string;
    
    switch (format) {
      case 'jpg':
        mimeType = 'image/jpeg';
        extension = 'jpg';
        break;
      case 'bmp':
        mimeType = 'image/bmp';
        extension = 'bmp';
        break;
      default:
        mimeType = 'image/png';
        extension = 'png';
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Failed to create download file");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const originalName = originalImage.name.replace(/\.[^/.]+$/, "");
      link.download = `${originalName}_processed.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    }, mimeType, format === 'jpg' ? 0.9 : undefined);
  };

  const canProcess = originalImageData && selectedSection;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Process Image
          </CardTitle>
          <CardDescription>
            Apply the selected pixel reordering pattern to your uploaded image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canProcess && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Upload an image and select a pattern section to begin processing</p>
            </div>
          )}
          
          {canProcess && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to process with:</p>
                  <p className="text-sm text-muted-foreground">
                    Pattern: {selectedSection.name} (Size: {selectedSection.size})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Image: {originalImageData.width}×{originalImageData.height} pixels
                  </p>
                </div>
                <Button 
                  onClick={processImage} 
                  disabled={processing}
                  className="bg-gradient-creative"
                >
                  {processing ? 'Processing...' : 'Process Image'}
                </Button>
              </div>
              
              {processing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing slices...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {processedImageData && previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Processed Result
            </CardTitle>
            <CardDescription>
              Preview and download your processed image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <img
                src={previewUrl}
                alt="Processed"
                className="max-w-full max-h-96 mx-auto rounded border shadow-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => downloadImage('png')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadImage('jpg')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download JPG
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadImage('bmp')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download BMP
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};