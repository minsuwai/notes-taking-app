"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { supabase, localStorageDB, type Category } from "@/lib/supabase"
import { Tag, X, Plus, Search } from "lucide-react"

interface SimpleMutliCategorySelectorProps {
  selectedCategoryIds: string[]
  onCategoriesChange: (categoryIds: string[]) => void
  refreshTrigger?: number
}

export function SimpleMultiCategorySelector({
  selectedCategoryIds,
  onCategoriesChange,
  refreshTrigger,
}: SimpleMutliCategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadCategories()
  }, [refreshTrigger])

  const loadCategories = async () => {
    console.log("Loading categories...")
    try {
      let data: Category[] = []

      if (supabase) {
        const { data: supabaseData, error } = await supabase.from("categories").select("*").order("name")

        if (error) throw error
        data = supabaseData || []
      } else {
        data = await localStorageDB.getCategories()
      }

      console.log("Loaded categories:", data)
      setCategories(data)
    } catch (error) {
      console.error("Failed to load categories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCategories = categories.filter((cat) => selectedCategoryIds.includes(cat.id))

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleCategory = (categoryId: string) => {
    console.log("Toggling category:", categoryId)
    const newSelectedIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId]

    console.log("New selection:", newSelectedIds)
    onCategoriesChange(newSelectedIds)
  }

  const removeCategory = (categoryId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    console.log("Removing category:", categoryId)
    const newSelectedIds = selectedCategoryIds.filter((id) => id !== categoryId)
    console.log("New selection after removal:", newSelectedIds)
    onCategoriesChange(newSelectedIds)
  }

  const handleOpenChange = (newOpen: boolean) => {
    console.log("Popover open state changing to:", newOpen)
    setOpen(newOpen)
    if (!newOpen) {
      setSearchTerm("") // Clear search when closing
    }
  }

  const handleAddCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Add Category button clicked, current open state:", open)
    setOpen(!open)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Loading categories...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        <span className="text-sm font-medium">Categories</span>
        <span className="text-xs text-muted-foreground">
          ({categories.length} available, {selectedCategories.length} selected)
        </span>
      </div>

      {/* Selected Categories Display */}
      <div className="flex items-center gap-2 flex-wrap min-h-[40px] p-3 border rounded-lg bg-muted/20">
        {selectedCategories.length > 0 ? (
          selectedCategories.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="text-xs flex items-center gap-1 pr-1"
              style={{
                backgroundColor: category.color + "20",
                color: category.color,
                borderColor: category.color + "40",
              }}
            >
              {category.name}
              <button
                type="button"
                onClick={(e) => removeCategory(category.id, e)}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${category.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No categories selected</span>
        )}

        {/* Category Selector Button - Always visible */}
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={handleAddCategoryClick}>
          <Plus className="h-3 w-3 mr-1" />
          Add Category
        </Button>
      </div>

      {/* Category Selector Dropdown - Conditional rendering */}
      {open && (
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 z-50 bg-popover border rounded-lg shadow-lg">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>
            <ScrollArea className="max-h-64">
              <div className="p-2">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {searchTerm ? "No categories found matching your search" : "No categories available"}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredCategories.map((category) => {
                      const isSelected = selectedCategoryIds.includes(category.id)
                      return (
                        <div
                          key={category.id}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => toggleCategory(category.id)}
                        >
                          <Checkbox checked={isSelected} readOnly className="pointer-events-none" />
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="flex-1 text-sm">{category.name}</span>
                          {category.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-32">
                              {category.description}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-2 border-t bg-muted/20">
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            style={{ backgroundColor: "transparent" }}
          />
        </div>
      )}

      {/* Debug Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Selected IDs: [{selectedCategoryIds.join(", ")}]</div>
        <div>Dropdown open: {open ? "Yes" : "No"}</div>
        <div>Categories loaded: {categories.length}</div>
      </div>
    </div>
  )
}
