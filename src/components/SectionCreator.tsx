import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";

export interface PixelSection {
  id: string;
  name: string;
  size: number;
  pattern: number[];
  createdAt: Date;
}

interface SectionCreatorProps {
  onSectionSelect: (section: PixelSection) => void;
  selectedSection: PixelSection | null;
}

export const SectionCreator = ({ onSectionSelect, selectedSection }: SectionCreatorProps) => {
  const [sections, setSections] = useState<PixelSection[]>([]);
  const [newSectionSize, setNewSectionSize] = useState<number>(6);
  const [newSectionName, setNewSectionName] = useState<string>("");
  const [newSectionPattern, setNewSectionPattern] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPattern, setEditPattern] = useState<string[]>([]);

  // Load sections from localStorage on mount
  useEffect(() => {
    const savedSections = localStorage.getItem("pixelSections");
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        setSections(parsed.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt) })));
      } catch (error) {
        console.error("Failed to load sections:", error);
      }
    }
  }, []);

  // Save sections to localStorage whenever sections change
  useEffect(() => {
    localStorage.setItem("pixelSections", JSON.stringify(sections));
  }, [sections]);

  // Initialize pattern inputs when size changes
  useEffect(() => {
    setNewSectionPattern(Array(newSectionSize).fill(""));
  }, [newSectionSize]);

  const handleCreateSection = () => {
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

    const newSection: PixelSection = {
      id: Date.now().toString(),
      name: newSectionName,
      size: newSectionSize,
      pattern,
      createdAt: new Date()
    };

    setSections(prev => [...prev, newSection]);
    setNewSectionName("");
    setNewSectionPattern(Array(newSectionSize).fill(""));
    toast.success("Section created successfully!");
  };

  const handleDeleteSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedSection?.id === id) {
      onSectionSelect(null as any);
    }
    toast.success("Section deleted");
  };

  const handleEditSection = (section: PixelSection) => {
    setEditingId(section.id);
    setEditPattern(section.pattern.map(String));
  };

  const handleSaveEdit = (id: string) => {
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

    setSections(prev => 
      prev.map(s => s.id === id ? { ...s, pattern } : s)
    );
    setEditingId(null);
    toast.success("Section updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPattern([]);
  };

  return (
    <div className="space-y-6">
      {/* Create New Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Create New Pattern Section</CardTitle>
          <CardDescription>
            Define a custom pixel reordering pattern for your textile designs
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
            Create Section
          </Button>
        </CardContent>
      </Card>

      {/* Existing Sections */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">Saved Sections</h3>
        {sections.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No sections created yet. Create your first pattern above!
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
