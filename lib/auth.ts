import { supabase } from "./supabase"

export type User = {
  id: string
  email: string
  name?: string
}

// Simple password hashing for localStorage fallback
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt_key_2024") // Simple salt
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export const authService = {
  // Get current user
  async getCurrentUser(): Promise<User | null> {
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return user
        ? {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.user_metadata?.full_name,
          }
        : null
    } else {
      // localStorage fallback
      const userStr = localStorage.getItem("currentUser")
      return userStr ? JSON.parse(userStr) : null
    }
  },

  // Sign up
  async signUp(email: string, password: string, name?: string): Promise<{ user: User | null; error: string | null }> {
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              full_name: name,
            },
          },
        })

        if (error) throw error

        return {
          user: data.user
            ? {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
              }
            : null,
          error: null,
        }
      } else {
        // localStorage fallback
        const users = JSON.parse(localStorage.getItem("users") || "[]")

        // Check if user already exists
        if (users.find((u: any) => u.email === email)) {
          return { user: null, error: "User already exists" }
        }

        const hashedPassword = await hashPassword(password)
        const newUser = {
          id: crypto.randomUUID(),
          email,
          password_hash: hashedPassword,
          name,
          created_at: new Date().toISOString(),
        }

        users.push(newUser)
        localStorage.setItem("users", JSON.stringify(users))

        const user = { id: newUser.id, email: newUser.email, name: newUser.name }
        localStorage.setItem("currentUser", JSON.stringify(user))

        return { user, error: null }
      }
    } catch (error: any) {
      return { user: null, error: error.message }
    }
  },

  // Sign in
  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        return {
          user: data.user
            ? {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
              }
            : null,
          error: null,
        }
      } else {
        // localStorage fallback
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const hashedPassword = await hashPassword(password)

        const user = users.find((u: any) => u.email === email && u.password_hash === hashedPassword)

        if (!user) {
          return { user: null, error: "Invalid email or password" }
        }

        const currentUser = { id: user.id, email: user.email, name: user.name }
        localStorage.setItem("currentUser", JSON.stringify(currentUser))

        return { user: currentUser, error: null }
      }
    } catch (error: any) {
      return { user: null, error: error.message }
    }
  },

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      } else {
        localStorage.removeItem("currentUser")
      }
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    }
  },

  // Listen to auth changes (Supabase only)
  onAuthStateChange(callback: (user: User | null) => void) {
    if (supabase) {
      return supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user
          ? {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
            }
          : null
        callback(user)
      })
    }
    return { data: { subscription: { unsubscribe: () => {} } } }
  },
}
