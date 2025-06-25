"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandList, CommandGroup, CommandInput, CommandItem, CommandEmpty } from "@/components/ui/command"
import { supabase, localStorageDB, type Category } from "@/lib/supabase"
import { Tag, Check, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiCategorySelectorProps {
  selectedCategoryIds: string[]
  onCategoriesChange: (categoryIds: string[]) => void
  refreshTrigger?: number
}

export function MultiCategorySelector({
  selectedCategoryIds,
  onCategoriesChange,
  refreshTrigger,
}: MultiCategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [refreshTrigger])

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

  const selectedCategories = categories.filter((cat) => selectedCategoryIds.includes(cat.id))

  const toggleCategory = (categoryId: string) => {
    const newSelectedIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId]

    console.log("Toggling category:", categoryId, "New selection:", newSelectedIds)
    onCategoriesChange(newSelectedIds)
  }

  const removeCategory = (categoryId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const newSelectedIds = selectedCategoryIds.filter((id) => id !== categoryId)
    console.log("Removing category:", categoryId, "New selection:", newSelectedIds)
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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        <span className="text-sm font-medium">Categories</span>
      </div>

      {/* Selected Categories Display */}
      <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
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

        {/* Category Selector Popover */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Category
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search categories..." className="h-9" />
              <CommandList>
                <CommandEmpty>No categories found.</CommandEmpty>
                <CommandGroup>
                  {categories.map((category) => {
                    const isSelected = selectedCategoryIds.includes(category.id)
                    return (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => {
                          toggleCategory(category.id)
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="flex-1">{category.name}</span>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Category Count */}
      {selectedCategories.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedCategories.length} {selectedCategories.length === 1 ? "category" : "categories"} selected
        </div>
      )}
    </div>
  )
}
