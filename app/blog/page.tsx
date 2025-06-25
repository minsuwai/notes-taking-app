"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Calendar, ArrowRight, AlertCircle, Tag } from "lucide-react"
import Link from "next/link"
import { supabase, localStorageDB, type Note } from "@/lib/supabase"

export default function BlogPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPublishedNotes()
  }, [])

  const loadPublishedNotes = async () => {
    try {
      let data: Note[] = []

      if (supabase) {
        console.log("Loading published notes from Supabase...")
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
          .eq("published", true)
          .order("published_at", { ascending: false })

        if (error) {
          console.error("Supabase error:", error)
          throw error
        }

        // Transform the data to include categories array
        data = (supabaseData || []).map((note: any) => ({
          ...note,
          categories: note.note_categories?.map((nc: any) => nc.category).filter(Boolean) || [],
        }))

        console.log("Loaded notes:", data.length)
      } else {
        data = await localStorageDB.getPublishedNotes()
      }

      setNotes(data)
      setError(null)
    } catch (error: any) {
      console.error("Failed to load published notes:", error)
      setError("Failed to load published notes. Please try again later.")
      setNotes([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div")
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ""
  }

  const getExcerpt = (content: string, maxLength = 150) => {
    const text = stripHtml(content)
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading notes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-start mb-12">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-4">Published Notes</h1>
            <p className="text-muted-foreground text-lg">
              Discover insights, thoughts, and ideas shared from our notes collection
            </p>
          </div>
          <div className="ml-4">
            <ThemeToggle />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message - Database is working */}
        {!error && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <p className="text-sm font-medium">✅ Database Connected Successfully!</p>
            </div>
            <p className="text-xs mt-1 text-green-600 dark:text-green-500">
              Your Supabase database is working properly. Create and publish some notes to see them here.
            </p>
          </div>
        )}

        {/* Notes Grid */}
        {notes.length === 0 && !error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold mb-2">No published notes yet</h2>
            <p className="text-muted-foreground mb-6">
              Create and publish some notes in the admin panel to see them here!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <Link key={note.id} href={`/blog/${note.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Published
                        </Badge>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Categories */}
                    {note.categories && note.categories.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {note.categories.slice(0, 3).map((category) => (
                            <Badge
                              key={category.id}
                              variant="outline"
                              className="text-xs px-2 py-0.5"
                              style={{
                                backgroundColor: category.color + "15",
                                borderColor: category.color + "40",
                                color: category.color,
                              }}
                            >
                              <Tag className="h-2.5 w-2.5 mr-1" />
                              {category.name}
                            </Badge>
                          ))}
                          {note.categories.length > 3 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              +{note.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                      {note.title || "Untitled"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{getExcerpt(note.content)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(note.published_at || note.updated_at)}
                      </div>
                      {note.categories && note.categories.length > 0 && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Tag className="h-3 w-3 mr-1" />
                          {note.categories.length} {note.categories.length === 1 ? "topic" : "topics"}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
