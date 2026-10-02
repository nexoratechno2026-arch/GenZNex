"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { StudentProfileDoc, ResumeTemplate } from "@/types/schema";
import {
  User,
  GraduationCap,
  Briefcase,
  Code2,
  Link as LinkIcon,
  FileText,
  Check,
  Loader2,
  ChevronLeft,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";

type Tab = "profile" | "education" | "experience" | "skills" | "links" | "preview";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User className="w-3.5 h-3.5" /> },
  { id: "education", label: "Education", icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { id: "experience", label: "Experience", icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: "skills", label: "Skills", icon: <Code2 className="w-3.5 h-3.5" /> },
  { id: "links", label: "Links", icon: <LinkIcon className="w-3.5 h-3.5" /> },
  { id: "preview", label: "Preview", icon: <Eye className="w-3.5 h-3.5" /> },
];

const TEMPLATES: { id: ResumeTemplate; name: string; desc: string; colors: string }[] = [
  { id: "classic", name: "Classic", desc: "Clean black & white, ATS-optimized", colors: "from-gray-700 to-gray-900" },
  { id: "modern", name: "Modern", desc: "Purple accent, bold headings", colors: "from-purple-700 to-indigo-900" },
  { id: "minimal", name: "Minimal", desc: "Ultra-clean, minimal color", colors: "from-zinc-600 to-zinc-800" },
];

const SUGGESTED_SKILLS = ["JavaScript", "React", "Node.js", "Python", "SQL", "Firebase", "TypeScript", "Next.js", "HTML/CSS", "Git", "REST APIs", "Communication", "Problem Solving"];

export default function ResumeBuilderPage() {
  const { user, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>("classic");

  const [profile, setProfile] = useState({
    headline: "",
    summary: "",
    skills: [] as string[],
    preferredRoles: [] as string[],
    preferredLocations: [] as string[],
    isProfileVisible: false,
    links: { github: "", linkedin: "", portfolio: "", other: "" },
    education: [] as { institution: string; degree: string; field: string; startYear: number; endYear?: number; gpa?: string }[],
    experience: [] as { company: string; role: string; startDate: string; endDate?: string; description: string; isCurrent: boolean }[],
  });

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "student_profiles", user!.uid));
        if (snap.exists()) {
          const data = snap.data() as StudentProfileDoc;
          setProfile({
            headline: data.headline || "",
            summary: data.summary || "",
            skills: data.skills || [],
            preferredRoles: data.preferredRoles || [],
            preferredLocations: data.preferredLocations || [],
            isProfileVisible: data.isProfileVisible ?? false,
            links: { github: data.links?.github || "", linkedin: data.links?.linkedin || "", portfolio: data.links?.portfolio || "", other: data.links?.other || "" },
            education: data.education || [],
            experience: data.experience || [],
          });
          setSelectedTemplate(data.resumeTemplate || "classic");
        } else {
          // Pre-fill from auth profile
          setProfile((p) => ({ ...p, headline: userProfile?.headline || "" }));
        }
      } catch (err) {
        console.error("Failed to load resume:", err);
      }
      setLoading(false);
    }
    load();
  }, [user, userProfile]);

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const fn = httpsCallable(functions, "saveResume");
      await fn({
        ...profile,
        links: Object.fromEntries(Object.entries(profile.links).filter(([, v]) => v)),
        resumeTemplate: selectedTemplate,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  function toggleSkill(skill: string) {
    setProfile((p) => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter((s) => s !== skill) : [...p.skills, skill],
    }));
  }

  function addEducation() {
    setProfile((p) => ({
      ...p,
      education: [...p.education, { institution: "", degree: "", field: "", startYear: new Date().getFullYear() }],
    }));
  }

  function removeEducation(i: number) {
    setProfile((p) => ({ ...p, education: p.education.filter((_, idx) => idx !== i) }));
  }

  function addExperience() {
    setProfile((p) => ({
      ...p,
      experience: [...p.experience, { company: "", role: "", startDate: "", description: "", isCurrent: false }],
    }));
  }

  function removeExperience(i: number) {
    setProfile((p) => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Resume Builder</h1>
          <p className="text-sm text-gray-400 mt-1">Build an ATS-friendly resume in minutes</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/student/placement">
            <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}>Back</Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            leftIcon={saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saveSuccess ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            onClick={handleSave}
            disabled={saving}
          >
            {saveSuccess ? "Saved!" : saving ? "Saving..." : "Save Resume"}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                : "text-gray-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="xl:col-span-2">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-4">
                  <FormField
                    label="Headline"
                    placeholder="e.g. Full-Stack Developer | React & Node.js"
                    value={profile.headline}
                    onChange={(v) => setProfile((p) => ({ ...p, headline: v }))}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Professional Summary</label>
                    <textarea
                      rows={4}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/60 resize-none"
                      placeholder="Brief overview of your background, skills, and career goals..."
                      value={profile.summary}
                      onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))}
                    />
                  </div>
                  <ChipsInput
                    label="Preferred Roles"
                    placeholder="Add role (e.g. Frontend Developer)"
                    values={profile.preferredRoles}
                    onChange={(v) => setProfile((p) => ({ ...p, preferredRoles: v }))}
                  />
                  <ChipsInput
                    label="Preferred Locations"
                    placeholder="Add location (e.g. Bangalore, Remote)"
                    values={profile.preferredLocations}
                    onChange={(v) => setProfile((p) => ({ ...p, preferredLocations: v }))}
                  />
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <input
                      type="checkbox"
                      id="profileVisible"
                      checked={profile.isProfileVisible}
                      onChange={(e) => setProfile((p) => ({ ...p, isProfileVisible: e.target.checked }))}
                      className="w-4 h-4 accent-purple-500"
                    />
                    <label htmlFor="profileVisible" className="text-xs text-gray-300">
                      Make my profile visible to placement officers and recruiters
                    </label>
                  </div>
                </div>
              )}

              {/* Education Tab */}
              {activeTab === "education" && (
                <div className="space-y-4">
                  {profile.education.map((edu, i) => (
                    <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-purple-300">Education #{i + 1}</p>
                        <button onClick={() => removeEducation(i)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          label="Institution"
                          value={edu.institution}
                          onChange={(v) => setProfile((p) => { const e = [...p.education]; e[i] = { ...e[i], institution: v }; return { ...p, education: e }; })}
                        />
                        <FormField
                          label="Degree"
                          value={edu.degree}
                          placeholder="e.g. B.Tech"
                          onChange={(v) => setProfile((p) => { const e = [...p.education]; e[i] = { ...e[i], degree: v }; return { ...p, education: e }; })}
                        />
                        <FormField
                          label="Field of Study"
                          value={edu.field}
                          placeholder="e.g. Computer Science"
                          onChange={(v) => setProfile((p) => { const e = [...p.education]; e[i] = { ...e[i], field: v }; return { ...p, education: e }; })}
                        />
                        <FormField
                          label="GPA (optional)"
                          value={edu.gpa || ""}
                          placeholder="e.g. 8.5/10"
                          onChange={(v) => setProfile((p) => { const e = [...p.education]; e[i] = { ...e[i], gpa: v }; return { ...p, education: e }; })}
                        />
                        <FormField
                          label="Start Year"
                          value={String(edu.startYear)}
                          type="number"
                          onChange={(v) => setProfile((p) => { const e = [...p.education]; e[i] = { ...e[i], startYear: Number(v) }; return { ...p, education: e }; })}
                        />
                        <FormField
                          label="End Year (or expected)"
                          value={String(edu.endYear || "")}
                          type="number"
                          onChange={(v) => setProfile((p) => { const e = [...p.education]; e[i] = { ...e[i], endYear: Number(v) }; return { ...p, education: e }; })}
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={addEducation}>
                    Add Education
                  </Button>
                </div>
              )}

              {/* Experience Tab */}
              {activeTab === "experience" && (
                <div className="space-y-4">
                  {profile.experience.map((exp, i) => (
                    <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-cyan-300">Experience #{i + 1}</p>
                        <button onClick={() => removeExperience(i)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField label="Company" value={exp.company} onChange={(v) => setProfile((p) => { const e = [...p.experience]; e[i] = { ...e[i], company: v }; return { ...p, experience: e }; })} />
                        <FormField label="Role / Title" value={exp.role} onChange={(v) => setProfile((p) => { const e = [...p.experience]; e[i] = { ...e[i], role: v }; return { ...p, experience: e }; })} />
                        <FormField label="Start Date (YYYY-MM)" value={exp.startDate} placeholder="2024-06" onChange={(v) => setProfile((p) => { const e = [...p.experience]; e[i] = { ...e[i], startDate: v }; return { ...p, experience: e }; })} />
                        {!exp.isCurrent && (
                          <FormField label="End Date (YYYY-MM)" value={exp.endDate || ""} placeholder="2025-01" onChange={(v) => setProfile((p) => { const e = [...p.experience]; e[i] = { ...e[i], endDate: v }; return { ...p, experience: e }; })} />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={exp.isCurrent} onChange={(ev) => setProfile((p) => { const e = [...p.experience]; e[i] = { ...e[i], isCurrent: ev.target.checked }; return { ...p, experience: e }; })} className="accent-purple-500" />
                        <span className="text-xs text-gray-300">Currently working here</span>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Description</label>
                        <textarea rows={3} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-purple-500/60" value={exp.description} onChange={(ev) => setProfile((p) => { const e = [...p.experience]; e[i] = { ...e[i], description: ev.target.value }; return { ...p, experience: e }; })} placeholder="Key achievements and responsibilities..." />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={addExperience}>
                    Add Experience
                  </Button>
                </div>
              )}

              {/* Skills Tab */}
              {activeTab === "skills" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">Suggested Skills (click to toggle)</label>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_SKILLS.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            profile.skills.includes(skill)
                              ? "bg-purple-600 text-white border-purple-500"
                              : "bg-zinc-900 text-gray-300 border-zinc-700 hover:border-purple-500/50"
                          }`}
                        >
                          {profile.skills.includes(skill) && <Check className="w-2.5 h-2.5 inline mr-1" />}
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ChipsInput
                    label="Custom Skills"
                    placeholder="Type a skill and press Enter"
                    values={profile.skills.filter((s) => !SUGGESTED_SKILLS.includes(s))}
                    onChange={(v) => setProfile((p) => ({ ...p, skills: [...SUGGESTED_SKILLS.filter((s) => p.skills.includes(s)), ...v] }))}
                  />
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <p className="text-xs text-gray-400">Selected: {profile.skills.length} skills</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.skills.map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Links Tab */}
              {activeTab === "links" && (
                <div className="space-y-4">
                  {(["github", "linkedin", "portfolio", "other"] as const).map((key) => (
                    <FormField
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1) + " URL"}
                      value={profile.links[key]}
                      placeholder={`https://${key}.com/yourprofile`}
                      type="url"
                      onChange={(v) => setProfile((p) => ({ ...p, links: { ...p.links, [key]: v } }))}
                    />
                  ))}
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === "preview" && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400">Choose a template to preview</p>
                  <div className="grid grid-cols-3 gap-3">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`rounded-xl border p-4 text-left transition-all ${selectedTemplate === t.id ? "border-purple-500 ring-2 ring-purple-500/30" : "border-zinc-700 hover:border-zinc-500"}`}
                      >
                        <div className={`h-16 rounded-lg bg-gradient-to-br ${t.colors} mb-3`} />
                        <p className="text-xs font-bold text-white">{t.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                  <ResumePreview profile={profile} template={selectedTemplate} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Completion Score */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completion Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Headline", done: !!profile.headline },
                { label: "Summary", done: !!profile.summary },
                { label: "Education", done: profile.education.length > 0 },
                { label: "Experience", done: profile.experience.length > 0 },
                { label: "Skills (5+)", done: profile.skills.length >= 5 },
                { label: "Links", done: !!(profile.links.github || profile.links.linkedin) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className={item.done ? "text-white" : "text-gray-500"}>{item.label}</span>
                  {item.done
                    ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                    : <span className="w-3.5 h-3.5 rounded-full border border-gray-600" />
                  }
                </div>
              ))}
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Profile strength</span>
                  <span className="text-white font-bold">
                    {Math.round(([profile.headline, profile.summary, profile.education.length > 0, profile.experience.length > 0, profile.skills.length >= 5, !!(profile.links.github || profile.links.linkedin)].filter(Boolean).length / 6) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
                    style={{ width: `${([profile.headline, profile.summary, profile.education.length > 0, profile.experience.length > 0, profile.skills.length >= 5, !!(profile.links.github || profile.links.linkedin)].filter(Boolean).length / 6) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label, value, onChange, placeholder = "", type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-300 mb-1.5">{label}</label>
      <input
        type={type}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/60 transition-colors"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ChipsInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");

  function addChip() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-300 mb-1.5">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/60"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addChip()}
        />
        <button onClick={addChip} className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-xs text-white border border-zinc-700">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-gray-400 hover:text-red-400 ml-0.5">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

function ResumePreview({ profile, template }: { profile: any; template: ResumeTemplate }) {
  const colors = {
    classic: { header: "bg-gray-900", accent: "border-gray-400", title: "text-white" },
    modern: { header: "bg-gradient-to-r from-purple-900 to-indigo-900", accent: "border-purple-400", title: "text-purple-200" },
    minimal: { header: "bg-zinc-900", accent: "border-zinc-400", title: "text-zinc-100" },
  }[template];

  return (
    <div className={`rounded-xl border border-zinc-700 overflow-hidden text-xs`}>
      <div className={`${colors.header} p-4`}>
        <h2 className={`font-black text-base ${colors.title}`}>{profile.headline || "Your Name"}</h2>
        <p className="text-gray-300 text-[11px] mt-0.5">{profile.headline}</p>
      </div>
      <div className="bg-[#0d0f1a] p-4 space-y-3">
        {profile.summary && (
          <div>
            <p className={`font-bold text-[11px] uppercase tracking-wider border-b pb-0.5 mb-1 ${colors.accent}`}>Summary</p>
            <p className="text-gray-300 text-[11px]">{profile.summary}</p>
          </div>
        )}
        {profile.skills.length > 0 && (
          <div>
            <p className={`font-bold text-[11px] uppercase tracking-wider border-b pb-0.5 mb-1 ${colors.accent}`}>Skills</p>
            <p className="text-gray-300 text-[11px]">{profile.skills.join(" · ")}</p>
          </div>
        )}
        {profile.education.length > 0 && (
          <div>
            <p className={`font-bold text-[11px] uppercase tracking-wider border-b pb-0.5 mb-1 ${colors.accent}`}>Education</p>
            {profile.education.map((edu: any, i: number) => (
              <div key={i} className="mb-1">
                <span className="text-white font-bold">{edu.institution}</span> · <span className="text-gray-300">{edu.degree} in {edu.field}</span>
                <span className="text-gray-500 ml-2">{edu.startYear}–{edu.endYear || "Present"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
