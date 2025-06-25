"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase, localStorageDB, type Category } from "@/lib/supabase"
import { Tag } from "lucide-react"

interface CategorySelectorProps {
  selectedCategoryId: string | null
  onCategoryChange: (categoryId: string | null) => void
  refreshTrigger?: number // Add this to force refresh
}

export function CategorySelector({ selectedCategoryId, onCategoryChange, refreshTrigger }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [refreshTrigger]) // Refresh when trigger changes

  const loadCategories = async () => {
    try {
      let data: Category[] = []

      if (supabase) {
        const { data: supabaseData, error } = await supabase.from("categories").select("*").order("name")

        if (error) throw error
        data = supabaseData || []
      } else {
        data = await localStorageDB.getCategories()
      }

      setCategories(data)
    } catch (error) {
      console.error("Failed to load categories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Loading categories...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Tag className="h-4 w-4" />
      <Select
        value={selectedCategoryId || "none"}
        onValueChange={(value) => onCategoryChange(value === "none" ? null : value)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Category</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedCategory && (
        <Badge
          variant="secondary"
          className="text-xs"
          style={{
            backgroundColor: selectedCategory.color + "20",
            color: selectedCategory.color,
            borderColor: selectedCategory.color + "40",
          }}
        >
          {selectedCategory.name}
        </Badge>
      )}
    </div>
  )
}
