"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Calendar, ArrowLeft, Share2, AlertCircle, Tag } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { supabase, localStorageDB, type Note } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function BlogPostPage() {
  const params = useParams()
  const [note, setNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (params.id) {
      loadNote(params.id as string)
    }
  }, [params.id])

  const loadNote = async (id: string) => {
    try {
      let data: Note | null = null

      if (supabase) {
        try {
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
            .eq("id", id)
            .eq("published", true)
            .single()

          if (error) {
            if (error.code === "PGRST116") {
              setNotFound(true)
              return
            } else if (error.code === "42P01" || error.message.includes("does not exist")) {
              console.warn("Notes table does not exist yet.")
              setError("Database not set up yet. Please run the setup scripts.")
              return
            }
            throw error
          }

          // Transform the data to include categories array
          data = {
            ...supabaseData,
            categories: supabaseData.note_categories?.map((nc: any) => nc.category).filter(Boolean) || [],
          }
        } catch (supabaseError: any) {
          console.warn("Supabase query failed, falling back to localStorage:", supabaseError.message)
          // Fall back to localStorage if Supabase fails
          const localNote = await localStorageDB.getPublishedNote(id)
          if (!localNote) {
            setNotFound(true)
            return
          }

          // Add category data for localStorage
          if (localNote.category_id) {
            const categories = await localStorageDB.getCategories()
            localNote.category = categories.find((cat) => cat.id === localNote.category_id)
          }
          data = localNote
        }
      } else {
        const localNote = await localStorageDB.getPublishedNote(id)
        if (!localNote) {
          setNotFound(true)
          return
        }

        // Add category data for localStorage
        if (localNote.category_id) {
          const categories = await localStorageDB.getCategories()
          localNote.category = categories.find((cat) => cat.id === localNote.category_id)
        }
        data = localNote
      }

      console.log("Loaded note with categories:", data)
      setNote(data)
    } catch (error: any) {
      console.error("Failed to load note:", error)
      setError("Failed to load note. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share && note) {
      try {
        await navigator.share({
          title: note.title,
          text: `Check out this note: ${note.title}`,
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied!",
      description: "The note link has been copied to your clipboard.",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading note...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <Link href="/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </Link>
            <ThemeToggle />
          </div>

          <div className="text-center py-12">
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-destructive mb-2">
                <AlertCircle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Error Loading Note</h2>
              </div>
              <p className="text-sm">{error}</p>
            </div>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !note) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <Link href="/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </Link>
            <ThemeToggle />
          </div>

          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h1 className="text-2xl font-semibold mb-2">Note not found</h1>
            <p className="text-muted-foreground mb-6">
              The note you're looking for doesn't exist or hasn't been published yet.
            </p>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation with Theme Toggle */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        {/* Article Header */}
        <article className="prose prose-lg max-w-none dark:prose-invert">
          <header className="mb-8 pb-8 border-b">
            {/* Status and Action Badges */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Published
                </Badge>
                {/* Categories - Simple display */}
                {note.categories && note.categories.length > 0 && (
                  <>
                    {note.categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="outline"
                        className="text-sm px-3 py-1"
                        style={{
                          backgroundColor: category.color + "15",
                          borderColor: category.color + "40",
                          color: category.color,
                        }}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {category.name}
                      </Badge>
                    ))}
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-6 leading-tight">{note.title || "Untitled"}</h1>

            {/* Publication Date */}
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <time dateTime={note.published_at || note.updated_at}>
                Published on {formatDate(note.published_at || note.updated_at)}
              </time>
            </div>
          </header>

          {/* Article Content */}
          <div
            className="prose prose-lg max-w-none dark:prose-invert
              prose-headings:text-foreground prose-headings:font-semibold 
              prose-p:text-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-em:text-foreground
              prose-code:bg-muted prose-code:text-foreground prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
              prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:p-4 prose-pre:rounded-lg
              prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary
              prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground
              text-foreground"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        </article>
      </div>
    </div>
  )
}
