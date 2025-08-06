import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project-ref.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface PixelSection {
  id: string;
  name: string;
  size: number;
  pattern: number[];
  created_at: string;
}

// Database operations for pixel sections
export const pixelSectionService = {
  // Get all sections
  async getAllSections(): Promise<PixelSection[]> {
    const { data, error } = await supabase
      .from('pixel_sections')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sections:', error);
      return [];
    }
    
    return data || [];
  },

  // Create a new section
  async createSection(section: Omit<PixelSection, 'id' | 'created_at'>): Promise<PixelSection | null> {
    const { data, error } = await supabase
      .from('pixel_sections')
      .insert([section])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating section:', error);
      return null;
    }
    
    return data;
  },

  // Update a section
  async updateSection(id: string, updates: Partial<Pick<PixelSection, 'name' | 'pattern'>>): Promise<PixelSection | null> {
    const { data, error } = await supabase
      .from('pixel_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating section:', error);
      return null;
    }
    
    return data;
  },

  // Delete a section
  async deleteSection(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('pixel_sections')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting section:', error);
      return false;
    }
    
    return true;
  },

  // Subscribe to real-time changes
  subscribeToSections(callback: (sections: PixelSection[]) => void) {
    return supabase
      .channel('pixel_sections_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pixel_sections' },
        () => {
          // Refetch all sections when there's a change
          this.getAllSections().then(callback);
        }
      )
      .subscribe();
  }
};