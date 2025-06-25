"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, FileText, Trash2 } from "lucide-react"
import type { Note } from "@/lib/supabase"
import { StorageStatus } from "./storage-status"
import { Badge } from "@/components/ui/badge"

interface NotesListProps {
  notes: Note[]
  selectedNoteId: string | null
  onSelectNote: (note: Note) => void
  onCreateNote: () => void
  onDeleteNote: (id: string) => void
}

export function NotesList({ notes, selectedNoteId, onSelectNote, onCreateNote, onDeleteNote }: NotesListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div")
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ""
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Notes</CardTitle>
          <Button onClick={onCreateNote} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        <StorageStatus />
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          {notes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notes yet</p>
              <p className="text-sm">Create your first note to get started</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedNoteId === note.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                  }`}
                  onClick={() => onSelectNote(note)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{note.title || "Untitled"}</h3>
                        {note.published && (
                          <Badge variant="default" className="text-xs px-1 py-0">
                            Published
                          </Badge>
                        )}
                      </div>

                      {/* Multiple Categories */}
                      {note.categories && note.categories.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {note.categories.slice(0, 2).map((category) => (
                            <Badge
                              key={category.id}
                              variant="outline"
                              className="text-xs px-2 py-0"
                              style={{
                                backgroundColor: category.color + "15",
                                borderColor: category.color + "40",
                                color: category.color,
                              }}
                            >
                              {category.name}
                            </Badge>
                          ))}
                          {note.categories.length > 2 && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              +{note.categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {stripHtml(note.content) || "No content"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(note.updated_at)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteNote(note.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
