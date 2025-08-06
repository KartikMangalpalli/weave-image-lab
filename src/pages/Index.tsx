import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionCreator, type PixelSection } from "@/components/SectionCreator";
import { ImageUpload } from "@/components/ImageUpload";
import { ImageProcessor } from "@/components/ImageProcessor";
import { Palette, Upload, Zap, Download } from "lucide-react";

const Index = () => {
  const [selectedSection, setSelectedSection] = useState<PixelSection | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);

  const handleImageUpload = (file: File, imageData: ImageData) => {
    setUploadedImage(file);
    setOriginalImageData(imageData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Textile Pattern Designer</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Professional pixel reordering tool for textile designers. Create custom patterns, 
              upload images, and generate unique textile designs with precision.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <Badge variant="secondary" className="px-3 py-1">
                <Palette className="h-4 w-4 mr-1" />
                Custom Patterns
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                <Upload className="h-4 w-4 mr-1" />
                BMP/RGB Support
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                <Zap className="h-4 w-4 mr-1" />
                Real-time Processing
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                <Download className="h-4 w-4 mr-1" />
                Multiple Formats
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Status Bar */}
        <div className="mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${selectedSection ? 'bg-success' : 'bg-muted'}`} />
                  <span>Pattern Section: {selectedSection ? selectedSection.name : 'None selected'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${uploadedImage ? 'bg-success' : 'bg-muted'}`} />
                  <span>Image: {uploadedImage ? uploadedImage.name : 'None uploaded'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${originalImageData ? 'bg-success' : 'bg-muted'}`} />
                  <span>Ready to Process: {selectedSection && originalImageData ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="sections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sections">Create Sections</TabsTrigger>
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="process">Process & Download</TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="space-y-4">
            <SectionCreator 
              onSectionSelect={setSelectedSection}
              selectedSection={selectedSection}
            />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <ImageUpload 
              onImageUpload={handleImageUpload}
              uploadedImage={uploadedImage}
            />
          </TabsContent>

          <TabsContent value="process" className="space-y-4">
            <ImageProcessor 
              originalImage={uploadedImage}
              originalImageData={originalImageData}
              selectedSection={selectedSection}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-muted-foreground">
          <p className="text-sm">
            Textile Pattern Designer - Professional pixel reordering for creative textile design
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
