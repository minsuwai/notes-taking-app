"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Save,
  Globe,
  GlobeIcon as GlobeOff,
  Undo,
  Redo,
  Type,
  Palette,
} from "lucide-react"
import { useRef, useState, useEffect } from "react"

interface AdvancedRichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onSave: () => void
  isPublished?: boolean
  onPublish?: () => void
  onUnpublish?: () => void
}

export function AdvancedRichTextEditor({
  content,
  onChange,
  onSave,
  isPublished = false,
  onPublish,
  onUnpublish,
}: AdvancedRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fontSize, setFontSize] = useState("16")
  const [fontFamily, setFontFamily] = useState("Arial")

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

    // Bold on Ctrl+B
    if (e.ctrlKey && e.key === "b") {
      e.preventDefault()
      handleFormat("bold")
    }

    // Italic on Ctrl+I
    if (e.ctrlKey && e.key === "i") {
      e.preventDefault()
      handleFormat("italic")
    }

    // Underline on Ctrl+U
    if (e.ctrlKey && e.key === "u") {
      e.preventDefault()
      handleFormat("underline")
    }
  }

  const insertLink = () => {
    const url = prompt("Enter URL:")
    if (url) {
      handleFormat("createLink", url)
    }
  }

  const insertImage = () => {
    const url = prompt("Enter image URL:")
    if (url) {
      handleFormat("insertImage", url)
    }
  }

  const changeFontSize = (size: string) => {
    setFontSize(size)
    handleFormat("fontSize", "7") // Reset to default first
    if (editorRef.current) {
      editorRef.current.style.fontSize = size + "px"
    }
  }

  const changeFontFamily = (family: string) => {
    setFontFamily(family)
    handleFormat("fontName", family)
  }

  const changeTextColor = () => {
    const color = prompt("Enter color (hex, rgb, or color name):")
    if (color) {
      handleFormat("foreColor", color)
    }
  }

  const changeBackgroundColor = () => {
    const color = prompt("Enter background color (hex, rgb, or color name):")
    if (color) {
      handleFormat("backColor", color)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-3 border-b bg-muted/30">
        {/* Font Controls */}
        <div className="flex items-center gap-2">
          <Select value={fontFamily} onValueChange={changeFontFamily}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Times New Roman">Times</SelectItem>
              <SelectItem value="Courier New">Courier</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
            </SelectContent>
          </Select>

          <Select value={fontSize} onValueChange={changeFontSize}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="14">14</SelectItem>
              <SelectItem value="16">16</SelectItem>
              <SelectItem value="18">18</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="32">32</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleFormat("bold")} className="h-8 w-8 p-0">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleFormat("italic")} className="h-8 w-8 p-0">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleFormat("underline")} className="h-8 w-8 p-0">
            <Underline className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleFormat("strikeThrough")} className="h-8 w-8 p-0">
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={changeTextColor} className="h-8 w-8 p-0" title="Text Color">
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={changeBackgroundColor}
            className="h-8 w-8 p-0"
            title="Background Color"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleFormat("justifyLeft")} className="h-8 w-8 p-0">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleFormat("justifyCenter")} className="h-8 w-8 p-0">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleFormat("justifyRight")} className="h-8 w-8 p-0">
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleFormat("justifyFull")} className="h-8 w-8 p-0">
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists and Blocks */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleFormat("insertUnorderedList")} className="h-8 w-8 p-0">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleFormat("insertOrderedList")} className="h-8 w-8 p-0">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat("formatBlock", "blockquote")}
            className="h-8 w-8 p-0"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleFormat("formatBlock", "pre")} className="h-8 w-8 p-0">
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Insert */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={insertLink} className="h-8 w-8 p-0">
            <Link className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={insertImage} className="h-8 w-8 p-0">
            <Image className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleFormat("undo")} className="h-8 w-8 p-0">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleFormat("redo")} className="h-8 w-8 p-0">
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="default" size="sm" onClick={handleSave} disabled={isLoading} className="h-8">
            <Save className="h-4 w-4 mr-1" />
            {isLoading ? "Saving..." : "Save"}
          </Button>
          {onPublish && onUnpublish && (
            <Button
              variant={isPublished ? "destructive" : "default"}
              size="sm"
              onClick={isPublished ? onUnpublish : onPublish}
              className="h-8"
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

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[500px] p-6 outline-none prose prose-sm max-w-none focus:ring-2 focus:ring-primary/20 focus:ring-inset"
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        style={{
          whiteSpace: "pre-wrap",
          fontSize: fontSize + "px",
          fontFamily: fontFamily,
        }}
        suppressContentEditableWarning={true}
      />
    </div>
  )
}
