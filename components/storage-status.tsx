"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Database, HardDrive, ExternalLink, Shield } from "lucide-react"
import Link from "next/link"

export function StorageStatus() {
  const isSupabaseConfigured = !!supabase

  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        {isSupabaseConfigured ? (
          <>
            <Badge variant="default" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Supabase
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              RLS
            </Badge>
          </>
        ) : (
          <Badge variant="secondary" className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            Local Storage
          </Badge>
        )}
      </div>
      <Link href="/blog">
        <Button variant="ghost" size="sm" className="h-6 text-xs">
          <ExternalLink className="h-3 w-3 mr-1" />
          View Blog
        </Button>
      </Link>
    </div>
  )
}
