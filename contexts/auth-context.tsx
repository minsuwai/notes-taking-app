"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { authService, type User } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial user
    authService.getCurrentUser().then((user) => {
      console.log("Initial user check:", user)
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes (Supabase only)
    const {
      data: { subscription },
    } = authService.onAuthStateChange((user) => {
      console.log("Auth state changed:", user)
      setUser(user)
      setLoading(false)

      // Redirect to admin after successful login
      if (user && window.location.pathname === "/auth") {
        router.push("/")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signIn = async (email: string, password: string) => {
    console.log("Attempting sign in...")
    const { user, error } = await authService.signIn(email, password)
    if (user) {
      console.log("Sign in successful:", user)
      setUser(user)
      // Redirect to admin panel after successful login
      setTimeout(() => {
        router.push("/")
      }, 100)
    }
    return { error }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    console.log("Attempting sign up...")
    const { user, error } = await authService.signUp(email, password, name)
    if (user) {
      console.log("Sign up successful:", user)
      setUser(user)
      // Redirect to admin panel after successful signup
      setTimeout(() => {
        router.push("/")
      }, 100)
    }
    return { error }
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
    router.push("/auth")
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
