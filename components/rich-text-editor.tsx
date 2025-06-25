"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Bold, Italic, Code, Save, Globe, GlobeIcon as GlobeOff } from "lucide-react"
import { useRef, useState, useEffect } from "react"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onSave: () => void
  isPublished?: boolean
  onPublish?: () => void
  onUnpublish?: () => void
}

export function RichTextEditor({
  content,
  onChange,
  onSave,
  isPublished = false,
  onPublish,
  onUnpublish,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content
    }
  }, [content])

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleContentChange()
  }

  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    await onSave()
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl+S
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
        <Button variant="ghost" size="sm" onClick={() => handleFormat("bold")} className="h-8 w-8 p-0">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleFormat("italic")} className="h-8 w-8 p-0">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleFormat("formatBlock", "pre")} className="h-8 w-8 p-0">
          <Code className="h-4 w-4" />
        </Button>
        <div className="ml-auto">
          <Button variant="default" size="sm" onClick={handleSave} disabled={isLoading} className="h-8">
            <Save className="h-4 w-4 mr-1" />
            {isLoading ? "Saving..." : "Save"}
          </Button>
          {onPublish && onUnpublish && (
            <Button
              variant={isPublished ? "destructive" : "default"}
              size="sm"
              onClick={isPublished ? onUnpublish : onPublish}
              className="h-8 ml-2"
            >
              {isPublished ? (
                <>
                  <GlobeOff className="h-4 w-4 mr-1" />
                  Unpublish
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-1" />
                  Publish
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 outline-none prose prose-sm max-w-none"
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        style={{
          whiteSpace: "pre-wrap",
        }}
        suppressContentEditableWarning={true}
      />
    </div>
  )
}
