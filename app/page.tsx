"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AdvancedRichTextEditor } from "@/components/advanced-rich-text-editor"
import { BasicCategorySelector } from "@/components/basic-category-selector"
import { NotesList } from "@/components/notes-list"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { supabase, localStorageDB, type Note } from "@/lib/supabase"
import { LogOut, User, Settings } from "lucide-react"
import Link from "next/link"

function NotesAppContent() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [categoryRefreshTrigger, setCategoryRefreshTrigger] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  // Debug logging
  useEffect(() => {
    console.log("Selected category IDs changed:", selectedCategoryIds)
  }, [selectedCategoryIds])

  // Load notes on component mount
  useEffect(() => {
    if (user) {
      loadNotes()
    }
  }, [user])

  const loadNotes = async () => {
    if (!user) return

    try {
      let data: Note[] = []

      if (supabase) {
        // Use Supabase - RLS automatically filters by user, include category data
        const { data: supabaseData, error } = await supabase
          .from("notes")
          .select(`
            *,
            note_categories(
              id,
              category_id,
              category:categories(*)
            )
          `)
          .order("updated_at", { ascending: false })

        if (error) {
          console.error("Supabase error:", error)
          throw error
        }

        // Transform the data to include categories array
        data = (supabaseData || []).map((note: any) => ({
          ...note,
          categories: note.note_categories?.map((nc: any) => nc.category).filter(Boolean) || [],
        }))
      } else {
        // Use localStorage as fallback
        data = await localStorageDB.getNotes()
        data = data.filter((note) => note.user_id === user.id)
      }

      console.log("Loaded notes with categories:", data)
      setNotes(data)
    } catch (error: any) {
      console.error("Failed to load notes:", error)
      toast({
        title: "Error",
        description: `Failed to load notes: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createNote = async () => {
    if (!user) return

    try {
      let newNote: Note

      if (supabase) {
        // Use Supabase - user_id is set automatically by trigger
        const { data, error } = await supabase
          .from("notes")
          .insert([
            {
              title: "New Note",
              content: "<p>Start writing your note here...</p>",
            },
          ])
          .select(`
            *,
            note_categories(
              id,
              category_id,
              category:categories(*)
            )
          `)
          .single()

        if (error) {
          console.error("Create note error:", error)
          throw error
        }

        newNote = {
          ...data,
          categories: data.note_categories?.map((nc: any) => nc.category).filter(Boolean) || [],
        }
      } else {
        // Use localStorage as fallback
        newNote = await localStorageDB.createNote({
          title: "New Note",
          content: "<p>Start writing your note here...</p>",
          user_id: user.id,
          category_id: null,
          categories: [],
        })
      }

      setNotes([newNote, ...notes])
      setSelectedNote(newNote)
      setTitle(newNote.title)
      setContent(newNote.content)
      setSelectedCategoryIds([])

      toast({
        title: "Success",
        description: "New note created",
      })
    } catch (error: any) {
      console.error("Failed to create note:", error)
      toast({
        title: "Error",
        description: `Failed to create note: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const saveNote = async () => {
    if (!selectedNote || !user) return

    console.log("Saving note with categories:", selectedCategoryIds)

    try {
      let updatedNote: Note

      if (supabase) {
        // Start a transaction-like operation
        const { error: updateError } = await supabase
          .from("notes")
          .update({
            title: title || "Untitled",
            content: content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedNote.id)

        if (updateError) {
          console.error("Update note error:", updateError)
          throw updateError
        }

        // Delete existing category relationships
        const { error: deleteError } = await supabase.from("note_categories").delete().eq("note_id", selectedNote.id)

        if (deleteError) {
          console.error("Delete categories error:", deleteError)
          throw deleteError
        }

        // Insert new category relationships
        if (selectedCategoryIds.length > 0) {
          const { error: insertError } = await supabase.from("note_categories").insert(
            selectedCategoryIds.map((categoryId) => ({
              note_id: selectedNote.id,
              category_id: categoryId,
            })),
          )

          if (insertError) {
            console.error("Insert categories error:", insertError)
            throw insertError
          }
        }

        // Fetch the updated note with categories
        const { data: noteData, error: fetchError } = await supabase
          .from("notes")
          .select(`
            *,
            note_categories(
              id,
              category_id,
              category:categories(*)
            )
          `)
          .eq("id", selectedNote.id)
          .single()

        if (fetchError) {
          console.error("Fetch updated note error:", fetchError)
          throw fetchError
        }

        updatedNote = {
          ...noteData,
          categories: noteData.note_categories?.map((nc: any) => nc.category).filter(Boolean) || [],
        }
      } else {
        // Use localStorage as fallback
        const categories = await localStorageDB.getCategories()
        const selectedCategories = categories.filter((cat) => selectedCategoryIds.includes(cat.id))

        updatedNote = await localStorageDB.updateNote(selectedNote.id, {
          title: title || "Untitled",
          content: content,
          categories: selectedCategories,
        })
      }

      console.log("Note saved successfully with categories:", updatedNote.categories)
      setNotes(notes.map((note) => (note.id === selectedNote.id ? updatedNote : note)))
      setSelectedNote(updatedNote)

      toast({
        title: "Success",
        description: "Note saved successfully",
      })
    } catch (error: any) {
      console.error("Failed to save note:", error)
      toast({
        title: "Error",
        description: `Failed to save note: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const deleteNote = async (id: string) => {
    if (!user) return

    try {
      if (supabase) {
        // Use Supabase - RLS ensures user can only delete their own notes
        // Note categories will be deleted automatically due to CASCADE
        const { error } = await supabase.from("notes").delete().eq("id", id)

        if (error) throw error
      } else {
        // Use localStorage as fallback
        await localStorageDB.deleteNote(id)
      }

      setNotes(notes.filter((note) => note.id !== id))

      if (selectedNote?.id === id) {
        setSelectedNote(null)
        setTitle("")
        setContent("")
        setSelectedCategoryIds([])
      }

      toast({
        title: "Success",
        description: "Note deleted",
      })
    } catch (error: any) {
      console.error("Failed to delete note:", error)
      toast({
        title: "Error",
        description: `Failed to delete note: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const selectNote = (note: Note) => {
    console.log("Selecting note with categories:", note.categories)
    setSelectedNote(note)
    setTitle(note.title)
    setContent(note.content)
    const categoryIds = note.categories?.map((cat) => cat.id) || []
    console.log("Setting category IDs:", categoryIds)
    setSelectedCategoryIds(categoryIds)
  }

  const handleCategoriesChange = (categoryIds: string[]) => {
    console.log("Categories changed to:", categoryIds)
    setSelectedCategoryIds(categoryIds)
  }

  const publishNote = async () => {
    if (!selectedNote || !user) return

    try {
      let updatedNote: Note

      if (supabase) {
        const { data, error } = await supabase
          .from("notes")
          .update({
            published: true,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedNote.id)
          .select(`
            *,
            note_categories(
              id,
              category_id,
              category:categories(*)
            )
          `)
          .single()

        if (error) throw error

        updatedNote = {
          ...data,
          categories: data.note_categories?.map((nc: any) => nc.category).filter(Boolean) || [],
        }
      } else {
        updatedNote = await localStorageDB.publishNote(selectedNote.id)
      }

      setNotes(notes.map((note) => (note.id === selectedNote.id ? updatedNote : note)))
      setSelectedNote(updatedNote)

      toast({
        title: "Success",
        description: "Note published successfully",
      })
    } catch (error: any) {
      console.error("Failed to publish note:", error)
      toast({
        title: "Error",
        description: `Failed to publish note: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const unpublishNote = async () => {
    if (!selectedNote || !user) return

    try {
      let updatedNote: Note

      if (supabase) {
        const { data, error } = await supabase
          .from("notes")
          .update({
            published: false,
            published_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedNote.id)
          .select(`
            *,
            note_categories(
              id,
              category_id,
              category:categories(*)
            )
          `)
          .single()

        if (error) throw error

        updatedNote = {
          ...data,
          categories: data.note_categories?.map((nc: any) => nc.category).filter(Boolean) || [],
        }
      } else {
        updatedNote = await localStorageDB.unpublishNote(selectedNote.id)
      }

      setNotes(notes.map((note) => (note.id === selectedNote.id ? updatedNote : note)))
      setSelectedNote(updatedNote)

      toast({
        title: "Success",
        description: "Note unpublished successfully",
      })
    } catch (error: any) {
      console.error("Failed to unpublish note:", error)
      toast({
        title: "Error",
        description: `Failed to unpublish note: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: "Success",
      description: "Signed out successfully",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b bg-background/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{user?.name || user?.email}</span>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <NotesList
          notes={notes}
          selectedNoteId={selectedNote?.id || null}
          onSelectNote={selectNote}
          onCreateNote={createNote}
          onDeleteNote={deleteNote}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="border-b p-4 space-y-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
              />
            </div>
            <div className="flex-1 flex">
              {/* Editor */}
              <div className="flex-1 p-4">
                <AdvancedRichTextEditor
                  content={content}
                  onChange={setContent}
                  onSave={saveNote}
                  isPublished={selectedNote?.published || false}
                  onPublish={publishNote}
                  onUnpublish={unpublishNote}
                />
              </div>
              {/* Category Sidebar */}
              <div className="w-80 border-l p-4">
                <BasicCategorySelector
                  selectedCategoryIds={selectedCategoryIds}
                  onCategoriesChange={handleCategoriesChange}
                  refreshTrigger={categoryRefreshTrigger}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to Notes</h2>
              <p className="text-muted-foreground mb-4">
                Select a note from the sidebar or create a new one to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NotesApp() {
  return (
    <ProtectedRoute>
      <NotesAppContent />
    </ProtectedRoute>
  )
}
