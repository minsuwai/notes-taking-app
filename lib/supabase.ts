import { createClient } from "@supabase/supabase-js"

// Check if Supabase environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
}

export type NoteCategory = {
  id: string
  note_id: string
  category_id: string
  created_at: string
  category?: Category
}

export type Note = {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  published: boolean
  published_at: string | null
  user_id: string
  category_id: string | null // Keep for backward compatibility
  categories?: Category[] // New field for multiple categories
  note_categories?: NoteCategory[]
}

// Local storage fallback when Supabase is not configured
export const localStorageDB = {
  async getCategories(): Promise<Category[]> {
    if (typeof window === "undefined") return []
    const categories = localStorage.getItem("categories")
    if (categories) {
      return JSON.parse(categories)
    } else {
      // Default categories for localStorage
      const defaultCategories: Category[] = [
        {
          id: "1",
          name: "Technology",
          slug: "technology",
          description: "Tech-related articles and tutorials",
          color: "#3b82f6",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Personal",
          slug: "personal",
          description: "Personal thoughts and experiences",
          color: "#10b981",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Work",
          slug: "work",
          description: "Work-related notes and projects",
          color: "#f59e0b",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "4",
          name: "Ideas",
          slug: "ideas",
          description: "Creative ideas and brainstorming",
          color: "#8b5cf6",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "5",
          name: "Learning",
          slug: "learning",
          description: "Educational content and study notes",
          color: "#ef4444",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
      localStorage.setItem("categories", JSON.stringify(defaultCategories))
      return defaultCategories
    }
  },

  async getNotes(): Promise<Note[]> {
    if (typeof window === "undefined") return []
    const notes = localStorage.getItem("notes")
    const notesData = notes ? JSON.parse(notes) : []

    // Add categories to each note
    const categories = await this.getCategories()
    return notesData.map((note: Note) => ({
      ...note,
      categories:
        note.categories ||
        (note.category_id ? [categories.find((cat) => cat.id === note.category_id)].filter(Boolean) : []),
    }))
  },

  async createNote(note: Omit<Note, "id" | "created_at" | "updated_at">): Promise<Note> {
    if (typeof window === "undefined") throw new Error("Not in browser")

    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: false,
      published_at: null,
      categories: note.categories || [],
    }

    const notes = await this.getNotes()
    const updatedNotes = [newNote, ...notes.filter((n) => n.id !== newNote.id)]
    localStorage.setItem("notes", JSON.stringify(updatedNotes))
    return newNote
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    if (typeof window === "undefined") throw new Error("Not in browser")

    const notes = await this.getNotes()
    const noteIndex = notes.findIndex((note) => note.id === id)
    if (noteIndex === -1) throw new Error("Note not found")

    const updatedNote = {
      ...notes[noteIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    notes[noteIndex] = updatedNote
    localStorage.setItem("notes", JSON.stringify(notes))
    return updatedNote
  },

  async deleteNote(id: string): Promise<void> {
    if (typeof window === "undefined") throw new Error("Not in browser")

    const notes = await this.getNotes()
    const filteredNotes = notes.filter((note) => note.id !== id)
    localStorage.setItem("notes", JSON.stringify(filteredNotes))
  },

  async getPublishedNotes(): Promise<Note[]> {
    if (typeof window === "undefined") return []
    const notes = await this.getNotes()
    return notes
      .filter((note) => note.published)
      .sort(
        (a, b) =>
          new Date(b.published_at || b.updated_at).getTime() - new Date(a.published_at || a.updated_at).getTime(),
      )
  },

  async getPublishedNote(id: string): Promise<Note | null> {
    if (typeof window === "undefined") return null
    const notes = await this.getNotes()
    return notes.find((note) => note.id === id && note.published) || null
  },

  async publishNote(id: string): Promise<Note> {
    return this.updateNote(id, {
      published: true,
      published_at: new Date().toISOString(),
    })
  },

  async unpublishNote(id: string): Promise<Note> {
    return this.updateNote(id, {
      published: false,
      published_at: null,
    })
  },
}
