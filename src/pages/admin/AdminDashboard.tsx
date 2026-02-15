import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHeroEditor from "@/components/admin/AdminHeroEditor";
import AdminCategoriesEditor from "@/components/admin/AdminCategoriesEditor";
import AdminFormEditor from "@/components/admin/AdminFormEditor";
import AdminContactEditor from "@/components/admin/AdminContactEditor";
import AdminBrandingEditor from "@/components/admin/AdminBrandingEditor";
import AdminRedirectionsEditor from "@/components/admin/AdminRedirectionsEditor";
import AdminSectionStylesEditor from "@/components/admin/AdminSectionStylesEditor";
import AdminThemesEditor from "@/components/admin/AdminThemesEditor";
import {
  ImageIcon,
  LayoutGrid,
  FileEdit,
  Contact,
  Palette,
  ExternalLink,
  Type,
  Box,
  Sparkles,
} from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 font-display text-3xl font-bold text-foreground">
        Portfolio Settings
      </h1>
      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-2">
          <TabsTrigger value="hero" className="gap-1.5">
            <ImageIcon className="h-4 w-4" /> Hero
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" /> Categories
          </TabsTrigger>
          <TabsTrigger value="form" className="gap-1.5">
            <FileEdit className="h-4 w-4" /> Book Form
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-1.5">
            <Contact className="h-4 w-4" /> Contact & Footer
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5">
            <Type className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="redirections" className="gap-1.5">
            <ExternalLink className="h-4 w-4" /> Redirections
          </TabsTrigger>
          <TabsTrigger value="section-styles" className="gap-1.5">
            <Box className="h-4 w-4" /> Section Colors
          </TabsTrigger>
          <TabsTrigger value="themes" className="gap-1.5">
            <Sparkles className="h-4 w-4" /> Color Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <AdminHeroEditor />
        </TabsContent>
        <TabsContent value="categories">
          <AdminCategoriesEditor />
        </TabsContent>
        <TabsContent value="form">
          <AdminFormEditor />
        </TabsContent>
        <TabsContent value="contact">
          <AdminContactEditor />
        </TabsContent>
        <TabsContent value="branding">
          <AdminBrandingEditor />
        </TabsContent>
        <TabsContent value="redirections">
          <AdminRedirectionsEditor />
        </TabsContent>
        <TabsContent value="section-styles">
          <AdminSectionStylesEditor />
        </TabsContent>
        <TabsContent value="themes">
          <AdminThemesEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
