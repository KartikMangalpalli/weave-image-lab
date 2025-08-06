import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, Save, X, Users, Globe } from "lucide-react";
import { toast } from "sonner";
import { pixelSectionService, type PixelSection } from "@/lib/supabase";

interface DatabaseSectionCreatorProps {
  onSectionSelect: (section: PixelSection | null) => void;
  selectedSection: PixelSection | null;
}

export const DatabaseSectionCreator = ({ onSectionSelect, selectedSection }: DatabaseSectionCreatorProps) => {
  const [sections, setSections] = useState<PixelSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSectionSize, setNewSectionSize] = useState<number>(6);
  const [newSectionName, setNewSectionName] = useState<string>("");
  const [newSectionPattern, setNewSectionPattern] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPattern, setEditPattern] = useState<string[]>([]);

  // Load sections from database on mount
  useEffect(() => {
    loadSections();
    
    // Subscribe to real-time changes
    const subscription = pixelSectionService.subscribeToSections((updatedSections) => {
      setSections(updatedSections);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Initialize pattern inputs when size changes
  useEffect(() => {
    setNewSectionPattern(Array(newSectionSize).fill(""));
  }, [newSectionSize]);

  const loadSections = async () => {
    setLoading(true);
    const allSections = await pixelSectionService.getAllSections();
    setSections(allSections);
    setLoading(false);
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      toast.error("Please enter a section name");
      return;
    }

    const pattern = newSectionPattern.map(p => parseInt(p));
    
    // Validate pattern
    if (pattern.some(isNaN) || pattern.some(p => p < 1 || p > newSectionSize)) {
      toast.error(`Pattern must contain numbers between 1 and ${newSectionSize}`);
      return;
    }

    // Check for duplicates
    if (new Set(pattern).size !== pattern.length) {
      toast.error("Pattern cannot contain duplicate numbers");
      return;
    }

    const newSection = await pixelSectionService.createSection({
      name: newSectionName,
      size: newSectionSize,
      pattern
    });

    if (newSection) {
      setNewSectionName("");
      setNewSectionPattern(Array(newSectionSize).fill(""));
      toast.success("Section created and shared globally!");
      loadSections(); // Refresh the list
    } else {
      toast.error("Failed to create section");
    }
  };

  const handleDeleteSection = async (id: string) => {
    const success = await pixelSectionService.deleteSection(id);
    
    if (success) {
      if (selectedSection?.id === id) {
        onSectionSelect(null);
      }
      toast.success("Section deleted");
      loadSections(); // Refresh the list
    } else {
      toast.error("Failed to delete section");
    }
  };

  const handleEditSection = (section: PixelSection) => {
    setEditingId(section.id);
    setEditPattern(section.pattern.map(String));
  };

  const handleSaveEdit = async (id: string) => {
    const pattern = editPattern.map(p => parseInt(p));
    const section = sections.find(s => s.id === id);
    
    if (!section) return;

    // Validate pattern
    if (pattern.some(isNaN) || pattern.some(p => p < 1 || p > section.size)) {
      toast.error(`Pattern must contain numbers between 1 and ${section.size}`);
      return;
    }

    // Check for duplicates
    if (new Set(pattern).size !== pattern.length) {
      toast.error("Pattern cannot contain duplicate numbers");
      return;
    }

    const updatedSection = await pixelSectionService.updateSection(id, { pattern });
    
    if (updatedSection) {
      setEditingId(null);
      toast.success("Section updated successfully!");
      loadSections(); // Refresh the list
    } else {
      toast.error("Failed to update section");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPattern([]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Loading shared sections...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Database Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Globe className="h-4 w-4" />
            <span className="font-medium">Global Pattern Library</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All sections are shared globally. Create patterns that everyone can use!
          </p>
        </CardContent>
      </Card>

      {/* Create New Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Pattern Section
          </CardTitle>
          <CardDescription>
            Define a custom pixel reordering pattern that will be available to all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sectionName">Section Name</Label>
              <Input
                id="sectionName"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g., Diagonal Weave"
              />
            </div>
            <div>
              <Label htmlFor="sectionSize">Pattern Size</Label>
              <Input
                id="sectionSize"
                type="number"
                min="2"
                max="24"
                value={newSectionSize}
                onChange={(e) => setNewSectionSize(parseInt(e.target.value) || 6)}
              />
            </div>
          </div>

          <div>
            <Label>Pixel Order Pattern</Label>
            <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: `repeat(${Math.min(newSectionSize, 8)}, 1fr)` }}>
              {newSectionPattern.map((value, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Pos {index + 1}
                  </Label>
                  <Input
                    value={value}
                    onChange={(e) => {
                      const newPattern = [...newSectionPattern];
                      newPattern[index] = e.target.value;
                      setNewSectionPattern(newPattern);
                    }}
                    placeholder={(index + 1).toString()}
                    className="text-center"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter numbers 1-{newSectionSize} to define the column order for each vertical slice
            </p>
          </div>

          <Button onClick={handleCreateSection} className="w-full bg-gradient-primary">
            Share Pattern Globally
          </Button>
        </CardContent>
      </Card>

      {/* Existing Sections */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Global Pattern Library ({sections.length} patterns)
        </h3>
        {sections.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No patterns in the global library yet. Be the first to create one!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <Card 
                key={section.id} 
                className={`cursor-pointer transition-all ${
                  selectedSection?.id === section.id 
                    ? 'ring-2 ring-primary shadow-elegant' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => onSectionSelect(section)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-foreground">{section.name}</h4>
                        <span className="text-sm bg-secondary px-2 py-1 rounded">
                          Size: {section.size}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(section.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {editingId === section.id ? (
                        <div className="mt-3 space-y-2">
                          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(section.size, 8)}, 1fr)` }}>
                            {editPattern.map((value, index) => (
                              <Input
                                key={index}
                                value={value}
                                onChange={(e) => {
                                  const newPattern = [...editPattern];
                                  newPattern[index] = e.target.value;
                                  setEditPattern(newPattern);
                                }}
                                className="text-center text-xs"
                              />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit(section.id);
                              }}
                              className="bg-success"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Pattern: [{section.pattern.join(', ')}]
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSection(section);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(section.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
