"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TipTapEditor } from "@/components/admin/tiptap-editor";
import { slugify } from "@/lib/utils";
import { Save, Eye, ArrowLeft, X, Loader2, Upload, Download, Share2, Copy, Trash2, Check } from "lucide-react";
import Link from "next/link";

interface PostFormProps {
  initialData?: {
    id?: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    coverImage: string;
    published: boolean;
    featured: boolean;
    publishAt: string;
    tags: { id: string; name: string; slug: string }[];
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    canonicalUrl?: string;
    seriesId?: string;
    seriesOrder?: number;
  };
}

export function PostForm({ initialData }: PostFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlugState] = useState(initialData?.slug || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [published, setPublished] = useState(initialData?.published || false);
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags?.map((t) => t.name) || []);
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");
  const [ogImage, setOgImage] = useState(initialData?.ogImage || "");
  // Convert ISO publishAt to local datetime-local format for the input
  const [publishAt, setPublishAt] = useState(() => {
    if (!initialData?.publishAt) return "";
    const d = new Date(initialData.publishAt);
    if (isNaN(d.getTime())) return initialData.publishAt;
    // Format as YYYY-MM-DDTHH:MM in local timezone for datetime-local input
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl || "");
  const [seriesId, setSeriesId] = useState(initialData?.seriesId || "");
  const [seriesOrder, setSeriesOrder] = useState<number | "">(initialData?.seriesOrder ?? "");
  const [allSeries, setAllSeries] = useState<{ id: string; title: string }[]>([]);
  const [showNewSeries, setShowNewSeries] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState("");
  const [newSeriesDesc, setNewSeriesDesc] = useState("");
  const [creatingSeries, setCreatingSeries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Draft sharing state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharingDraft, setSharingDraft] = useState(false);
  const [draftShares, setDraftShares] = useState<Array<{
    id: string;
    email: string;
    token: string;
    expiresAt: string;
    viewedAt: string | null;
  }>>([]);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [loadingShares, setLoadingShares] = useState(false);

  // Fetch series list
  const fetchSeries = useCallback(() => {
    fetch("/api/admin/series")
      .then((r) => r.ok ? r.json() : { series: [] })
      .then((data) => setAllSeries(data.series || []))
      .catch(() => {});
  }, []);

  useState(() => {
    fetchSeries();
  });

  const handleCreateSeries = async () => {
    if (!newSeriesTitle.trim()) return;
    setCreatingSeries(true);
    try {
      const res = await fetch("/api/admin/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSeriesTitle.trim(), description: newSeriesDesc.trim() }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 409) {
        alert(data.error || "Failed to create series");
        return;
      }
      // If 409 (already exists), the API returns the existing series
      const series = data.series || data;
      fetchSeries();
      setSeriesId(series.id);
      setNewSeriesTitle("");
      setNewSeriesDesc("");
      setShowNewSeries(false);
    } catch {
      alert("Failed to create series");
    } finally {
      setCreatingSeries(false);
    }
  };

  // Fetch draft shares for this post
  const fetchDraftShares = useCallback(async () => {
    if (!initialData?.id) return;
    setLoadingShares(true);
    try {
      const res = await fetch(`/api/posts/share-draft?postId=${initialData.id}`);
      if (res.ok) {
        const data = await res.json();
        setDraftShares(data.shares || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingShares(false);
    }
  }, [initialData?.id]);

  // Load shares when dialog opens
  useEffect(() => {
    if (showShareDialog && initialData?.id) {
      fetchDraftShares();
    }
  }, [showShareDialog, initialData?.id, fetchDraftShares]);

  const handleShareDraft = async () => {
    if (!shareEmail.trim() || !initialData?.id) return;
    setSharingDraft(true);
    try {
      const res = await fetch("/api/posts/share-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: initialData.id,
          email: shareEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to share draft");
        return;
      }
      // Copy share URL to clipboard
      await navigator.clipboard.writeText(data.shareUrl);
      setCopiedShareId(data.share.id);
      setTimeout(() => setCopiedShareId(null), 2000);
      setShareEmail("");
      fetchDraftShares();
    } catch {
      alert("Failed to share draft");
    } finally {
      setSharingDraft(false);
    }
  };

  const handleCopyShareLink = async (token: string, shareId: string) => {
    const shareUrl = `${window.location.origin}/draft/${token}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedShareId(shareId);
    setTimeout(() => setCopiedShareId(null), 2000);
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!confirm("Revoke access for this email?")) return;
    try {
      const res = await fetch(`/api/posts/share-draft?shareId=${shareId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to revoke share");
        return;
      }
      fetchDraftShares();
    } catch {
      alert("Failed to revoke share");
    }
  };

  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditing) {
      setSlugState(slugify(value));
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  }, []);

  const handleImportMarkdown = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/posts/import", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }
      const { postData } = await res.json();
      setTitle(postData.title || "");
      if (postData.slug) setSlugState(postData.slug);
      else if (postData.title) setSlugState(slugify(postData.title));
      setContent(postData.content || "");
      setExcerpt(postData.excerpt || "");
      setCoverImage(postData.coverImage || "");
      setPublished(postData.published || false);
      setFeatured(postData.featured || false);
      if (postData.tags?.length) setTags(postData.tags);
      setMetaTitle(postData.metaTitle || "");
      setMetaDescription(postData.metaDescription || "");
      setOgImage(postData.ogImage || "");
      if (postData.publishAt) setPublishAt(postData.publishAt);
    } catch (err: any) {
      alert(err.message || "Failed to import markdown");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isEditing]);

  const handleExportMarkdown = useCallback(() => {
    if (!initialData?.id || !slug) return;
    window.open(`/api/posts/${encodeURIComponent(slug)}/export`, "_blank");
  }, [initialData?.id, slug]);

  const handleSave = async (asDraft = false) => {
    if (tags.length === 0) {
      alert("Please select at least one category tag (Personal or Technical).");
      return;
    }
    setSaving(true);
    try {
      // Convert datetime-local value to a full ISO string with timezone
      // datetime-local gives "YYYY-MM-DDTHH:MM" which is user's local time
      // new Date("YYYY-MM-DDTHH:MM") in the browser interprets it as local time
      const publishAtISO = publishAt ? new Date(publishAt).toISOString() : "";

      const postData = {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        published: asDraft ? false : published,
        featured,
        tags,
        publishAt: publishAtISO,
        metaTitle,
        metaDescription,
        ogImage,
        canonicalUrl: canonicalUrl || undefined,
        seriesId: seriesId || undefined,
        seriesOrder: seriesOrder !== "" ? Number(seriesOrder) : undefined,
      };

      const url = isEditing ? `/api/posts/edit/${initialData!.id}` : "/api/posts";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save");
      }

      router.push("/admin/posts");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/posts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{isEditing ? "Edit Post" : "New Post"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Import Markdown */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.mdx"
            className="hidden"
            onChange={handleImportMarkdown}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import
          </Button>
          {/* Export Markdown */}
          {isEditing && (
            <Button variant="outline" onClick={handleExportMarkdown}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
          {/* Share Draft */}
          {isEditing && (
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Draft
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Draft</DialogTitle>
                  <DialogDescription>
                    Share this draft with specific people by email. Only they can access it.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleShareDraft();
                        }
                      }}
                    />
                    <Button onClick={handleShareDraft} disabled={sharingDraft || !shareEmail.trim()}>
                      {sharingDraft ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Share"
                      )}
                    </Button>
                  </div>
                  {loadingShares ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : draftShares.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-sm">Shared with:</Label>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {draftShares.map((share) => (
                          <div
                            key={share.id}
                            className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium">{share.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {share.viewedAt
                                  ? `Viewed ${new Date(share.viewedAt).toLocaleDateString()}`
                                  : "Not yet viewed"}
                                {" • "}
                                Expires {new Date(share.expiresAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCopyShareLink(share.token, share.id)}
                                title="Copy link"
                              >
                                {copiedShareId === share.id ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRevokeShare(share.id)}
                                title="Revoke access"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No shares yet. Enter an email above to share this draft.
                    </p>
                  )}
                </div>
                <DialogFooter className="sm:justify-start">
                  <p className="text-xs text-muted-foreground">
                    Share links expire in 7 days. Recipients must enter their email to view.
                  </p>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? "Edit" : "Preview"}
          </Button>
          <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
            Save Draft
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      {showPreview ? (
        /* Preview */
        <div className="max-w-3xl mx-auto">
          <article>
            {coverImage && (
              <img src={coverImage} alt={title} className="w-full rounded-lg mb-8" />
            )}
            <h1 className="text-4xl font-bold tracking-tight mb-4">{title}</h1>
            {excerpt && <p className="text-lg text-muted-foreground mb-8">{excerpt}</p>}
            {tags.length > 0 && (
              <div className="flex gap-2 mb-6">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
            <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }} />
          </article>
        </div>
      ) : (
        /* Editor Form */
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main content */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Post title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="post-slug"
                value={slug}
                onChange={(e) => setSlugState(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <TipTapEditor
                content={content}
                onChange={setContent}
                onImageUpload={handleImageUpload}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish settings */}
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold">Settings</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Published</Label>
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={setPublished}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured</Label>
                <Switch
                  id="featured"
                  checked={featured}
                  onCheckedChange={setFeatured}
                />
              </div>
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="publishAt">Schedule Publish</Label>
                <Input
                  id="publishAt"
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {publishAt ? "Post will auto-publish at this time" : "Leave empty for immediate publish"}
                </p>
              </div>
            </div>

            {/* Excerpt */}
            <div className="rounded-lg border p-4 space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief description of the post"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
              />
            </div>

            {/* Cover Image */}
            <div className="rounded-lg border p-4 space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                placeholder="https://..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
              {coverImage && (
                <img src={coverImage} alt="Cover preview" className="w-full rounded mt-2" />
              )}
            </div>

            {/* Tags */}
            <div className="rounded-lg border p-4 space-y-2">
              <Label>Tags <span className="text-destructive">*</span></Label>
              <div className="flex gap-2 mb-2">
                {["Personal", "Technical"].map((cat) => {
                  const selected = tags.includes(cat);
                  return (
                    <Button
                      key={cat}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (selected) {
                          setTags(tags.filter((t) => t !== cat));
                        } else {
                          if (!tags.includes(cat)) setTags([...tags, cat]);
                        }
                      }}
                    >
                      {selected && "✓ "}{cat}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Select Personal or Technical, then add more tags below.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* SEO */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold">SEO</h3>
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="SEO title (max 60 chars)"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{metaTitle.length}/60</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="SEO description (max 160 chars)"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={160}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">{metaDescription.length}/160</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">OG Image URL</Label>
                <Input
                  id="ogImage"
                  placeholder="https://..."
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  placeholder="https://medium.com/... (for cross-posted articles)"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Set if this post was originally published elsewhere</p>
              </div>
            </div>

            {/* Series */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Series</h3>
                <button
                  type="button"
                  onClick={() => setShowNewSeries(!showNewSeries)}
                  className="text-xs text-primary hover:underline"
                >
                  {showNewSeries ? "Cancel" : "+ New Series"}
                </button>
              </div>

              {showNewSeries && (
                <div className="space-y-2 rounded-md border border-dashed p-3">
                  <div className="space-y-1">
                    <Label htmlFor="newSeriesTitle">Title</Label>
                    <Input
                      id="newSeriesTitle"
                      placeholder="e.g. Building a Blog with Next.js"
                      value={newSeriesTitle}
                      onChange={(e) => setNewSeriesTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newSeriesDesc">Description (optional)</Label>
                    <Input
                      id="newSeriesDesc"
                      placeholder="A short description of the series"
                      value={newSeriesDesc}
                      onChange={(e) => setNewSeriesDesc(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateSeries}
                    disabled={creatingSeries || !newSeriesTitle.trim()}
                  >
                    {creatingSeries ? "Creating..." : "Create Series"}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="seriesId">Series</Label>
                <select
                  id="seriesId"
                  value={seriesId}
                  onChange={(e) => setSeriesId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">No series</option>
                  {allSeries.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              {seriesId && (
                <div className="space-y-2">
                  <Label htmlFor="seriesOrder">Order in Series</Label>
                  <Input
                    id="seriesOrder"
                    type="number"
                    min={1}
                    placeholder="1"
                    value={seriesOrder}
                    onChange={(e) => setSeriesOrder(e.target.value ? parseInt(e.target.value) : "")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
