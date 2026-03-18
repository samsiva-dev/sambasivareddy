"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { TipTapEditor } from "@/components/admin/tiptap-editor";
import { slugify } from "@/lib/utils";
import { Save, Eye, ArrowLeft, X, Loader2, Upload, Download } from "lucide-react";
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
  const [publishAt, setPublishAt] = useState(initialData?.publishAt || "");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
    setSaving(true);
    try {
      const postData = {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        published: asDraft ? false : published,
        featured,
        tags,
        publishAt,
        metaTitle,
        metaDescription,
        ogImage,
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
              <Label>Tags</Label>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
