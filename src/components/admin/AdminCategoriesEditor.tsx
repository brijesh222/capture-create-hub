import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/context/SiteConfigContext";
import type { CategoryConfig, MediaItem } from "@/types/site-config";
import { Plus, Trash2, ImagePlus, Video } from "lucide-react";

export default function AdminCategoriesEditor() {
  const { config, updateConfig } = useSiteConfig();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateCategory = (id: string, updates: Partial<CategoryConfig>) => {
    const next = config.categories.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    updateConfig("categories", next);
  };

  const addCategory = () => {
    const num = config.categories.length + 1;
    const slug = `category-${num}`;
    const newCat: CategoryConfig = {
      id: String(Date.now()),
      name: `New Category ${num}`,
      slug,
      description: "",
      icon: "📷",
      thumbnailUrl: "",
      media: [],
    };
    updateConfig("categories", [...config.categories, newCat]);
    setExpandedId(newCat.id);
  };

  const removeCategory = (id: string) => {
    if (config.categories.length <= 1) return;
    updateConfig(
      "categories",
      config.categories.filter((c) => c.id !== id)
    );
    if (expandedId === id) setExpandedId(null);
  };

  const addMedia = (categoryId: string, type: "photo" | "video") => {
    const cat = config.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const newItem: MediaItem = {
      id: String(Date.now()),
      type,
      url: "",
    };
    updateCategory(categoryId, {
      media: [...cat.media, newItem],
    });
  };

  const updateMedia = (categoryId: string, itemId: string, updates: Partial<MediaItem>) => {
    const cat = config.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const media = cat.media.map((m) =>
      m.id === itemId ? { ...m, ...updates } : m
    );
    updateCategory(categoryId, { media });
  };

  const removeMedia = (categoryId: string, itemId: string) => {
    const cat = config.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    updateCategory(categoryId, {
      media: cat.media.filter((m) => m.id !== itemId),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>Add, edit categories and set thumbnail + photos/videos per category.</CardDescription>
        <Button onClick={addCategory} size="sm" className="w-fit mt-2">
          <Plus className="h-4 w-4 mr-1" /> Add category
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {config.categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                className="font-medium text-foreground hover:underline text-left"
              >
                {cat.icon} {cat.name}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCategory(cat.id)}
                disabled={config.categories.length <= 1}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {expandedId === cat.id && (
              <div className="grid gap-3 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={cat.name}
                      onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Slug (URL)</Label>
                    <Input
                      value={cat.slug}
                      onChange={(e) => updateCategory(cat.id, { slug: e.target.value })}
                      placeholder="wedding"
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={cat.description}
                    onChange={(e) => updateCategory(cat.id, { description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Icon (emoji)</Label>
                  <Input
                    value={cat.icon}
                    onChange={(e) => updateCategory(cat.id, { icon: e.target.value })}
                    placeholder="💍"
                  />
                </div>
                <div>
                  <Label>Thumbnail image URL</Label>
                  <Input
                    value={cat.thumbnailUrl}
                    onChange={(e) =>
                      updateCategory(cat.id, { thumbnailUrl: e.target.value })
                    }
                    placeholder="https://... or leave empty for default"
                  />
                </div>

                <div>
                  <Label className="block mb-2">Photos & videos in this category</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addMedia(cat.id, "photo")}
                    >
                      <ImagePlus className="h-4 w-4 mr-1" /> Add photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addMedia(cat.id, "video")}
                    >
                      <Video className="h-4 w-4 mr-1" /> Add video
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {cat.media.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-2 items-center rounded border border-border p-2 bg-background"
                      >
                        <span className="text-muted-foreground text-sm">
                          {item.type === "photo" ? "🖼" : "🎬"}
                        </span>
                        <Input
                          value={item.url}
                          onChange={(e) =>
                            updateMedia(cat.id, item.id, { url: e.target.value })
                          }
                          placeholder={item.type === "photo" ? "Image URL" : "Video URL (embed or direct)"}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedia(cat.id, item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
