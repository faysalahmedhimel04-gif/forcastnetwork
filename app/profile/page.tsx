"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Profile } from "@/types"
import { FORECAST_CATEGORIES } from "@/types"

export default function ProfileEditPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    expertise_areas: [] as string[],
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = "/login"
        return
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (data) {
        setProfile(data)
        setForm({
          full_name: data.full_name || "",
          bio: data.bio || "",
          expertise_areas: data.expertise_areas || [],
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    setSaving(true)

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        bio: form.bio || null,
        expertise_areas: form.expertise_areas,
      })
      .eq("id", profile.id)

    setSaving(false)

    if (error) {
      toast.error("Failed to update profile")
    } else {
      toast.success("Profile updated successfully")
    }
  }

  function toggleExpertise(area: string) {
    setForm((prev) => ({
      ...prev,
      expertise_areas: prev.expertise_areas.includes(area)
        ? prev.expertise_areas.filter((a) => a !== area)
        : [...prev.expertise_areas, area],
    }))
  }

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground">Loading profile...</div>
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Edit profile</h1>
      <p className="text-muted-foreground mb-8">Update how other forecasters see you on the network.</p>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Public information</CardTitle>
            <CardDescription>This appears on your analyst profile and leaderboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input 
                id="full_name" 
                value={form.full_name} 
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
                placeholder="Jane Doe" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                value={form.bio} 
                onChange={(e) => setForm({ ...form, bio: e.target.value })} 
                placeholder="Macro forecaster focused on rates, geopolitics, and tech disruption. 8 years experience." 
                className="min-h-[110px]" 
              />
            </div>

            <div>
              <Label className="mb-2 block">Areas of expertise</Label>
              <div className="flex flex-wrap gap-2">
                {FORECAST_CATEGORIES.map((cat) => {
                  const selected = form.expertise_areas.includes(cat)
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleExpertise(cat)}
                      className={`text-sm px-3 py-1 rounded-full border transition ${selected ? "bg-accent border-accent text-white" : "hover:bg-muted"}`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">Select all that apply. Shown on your public profile.</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        </div>
      </form>

      <div className="mt-10 text-xs text-muted-foreground">
        Username and accuracy stats are managed automatically. Username cannot be changed after signup.
      </div>
    </div>
  )
}
