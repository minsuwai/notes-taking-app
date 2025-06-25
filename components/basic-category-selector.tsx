"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { supabase, localStorageDB, type Category } from "@/lib/supabase"
import { Tag, X, Plus, Search, ChevronDown, ChevronUp } from "lucide-react"

interface BasicCategorySelectorProps {
  selectedCategoryIds: string[]
  onCategoriesChange: (categoryIds: string[]) => void
  refreshTrigger?: number
}

export function BasicCategorySelector({
  selectedCategoryIds,
  onCategoriesChange,
  refreshTrigger,
}: BasicCategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Loading categories...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Categories
          <Badge variant="outline" className="text-xs">
            {selectedCategories.length} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
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
            ))}
          </div>
        )}

        {/* Toggle Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={() => {
            console.log("Toggle button clicked, current state:", isExpanded)
            setIsExpanded(!isExpanded)
          }}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {isExpanded ? "Hide Categories" : "Add Categories"}
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {/* Category Selection */}
        {isExpanded && (
          <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Categories List */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  {searchTerm ? "No categories found matching your search" : "No categories available"}
                </div>
              ) : (
                filteredCategories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id)
                  return (
                    <div
                      key={category.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-background cursor-pointer border"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <Checkbox checked={isSelected} readOnly className="pointer-events-none" />
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-muted-foreground truncate">{category.description}</div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                {selectedCategories.length} of {categories.length} selected
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted/20 rounded">
          <div>Selected IDs: [{selectedCategoryIds.join(", ")}]</div>
          <div>Expanded: {isExpanded ? "Yes" : "No"}</div>
          <div>Categories loaded: {categories.length}</div>
        </div>
      </CardContent>
    </Card>
  )
}
