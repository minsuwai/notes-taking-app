"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { supabase, localStorageDB, type Category } from "@/lib/supabase"
import { Plus, Edit, Trash2, Tag } from "lucide-react"

interface CategoryManagerProps {
  onCategoryChange?: () => void
}

export function CategoryManager({ onCategoryChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [])

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
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const slug = generateSlug(formData.name)

      if (editingCategory) {
        // Update existing category
        if (supabase) {
          const { error } = await supabase
            .from("categories")
            .update({
              name: formData.name.trim(),
              slug: slug,
              description: formData.description.trim() || null,
              color: formData.color,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingCategory.id)

          if (error) throw error
        } else {
          // Update in localStorage
          const updatedCategories = categories.map((cat) =>
            cat.id === editingCategory.id
              ? {
                  ...cat,
                  name: formData.name.trim(),
                  slug: slug,
                  description: formData.description.trim() || null,
                  color: formData.color,
                  updated_at: new Date().toISOString(),
                }
              : cat,
          )
          localStorage.setItem("categories", JSON.stringify(updatedCategories))
        }

        toast({
          title: "Success",
          description: "Category updated successfully",
        })
      } else {
        // Create new category
        if (supabase) {
          const { error } = await supabase.from("categories").insert([
            {
              name: formData.name.trim(),
              slug: slug,
              description: formData.description.trim() || null,
              color: formData.color,
            },
          ])

          if (error) throw error
        } else {
          // Add to localStorage
          const newCategory: Category = {
            id: crypto.randomUUID(),
            name: formData.name.trim(),
            slug: slug,
            description: formData.description.trim() || null,
            color: formData.color,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          const updatedCategories = [...categories, newCategory]
          localStorage.setItem("categories", JSON.stringify(updatedCategories))
        }

        toast({
          title: "Success",
          description: "Category created successfully",
        })
      }

      // Reload categories and close dialog
      await loadCategories()
      setIsDialogOpen(false)
      resetForm()
      onCategoryChange?.()
    } catch (error: any) {
      console.error("Failed to save category:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return
    }

    try {
      if (supabase) {
        const { error } = await supabase.from("categories").delete().eq("id", category.id)

        if (error) throw error
      } else {
        // Remove from localStorage
        const updatedCategories = categories.filter((cat) => cat.id !== category.id)
        localStorage.setItem("categories", JSON.stringify(updatedCategories))
      }

      await loadCategories()
      onCategoryChange?.()

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
    } catch (error: any) {
      console.error("Failed to delete category:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
    })
    setEditingCategory(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading categories...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categories
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter category description (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 rounded border border-input cursor-pointer"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingCategory ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No categories yet</p>
              <p className="text-sm">Create your first category to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{category.name}</h4>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: category.color + "15",
                            borderColor: category.color + "40",
                            color: category.color,
                          }}
                        >
                          {category.slug}
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-xs text-muted-foreground truncate">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(category)} className="h-8 w-8 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
