import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { homepageSectionAPI } from "@services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { Badge } from "@components/ui/badge";
import { Loading, ErrorMessage } from "@components/ui/loading";
import { EmptyState, TableEmptyRow } from "@components/common/EmptyState";
import { Plus, Edit, Trash2, RefreshCw, LayoutList, Search } from "lucide-react";

const EMPTY_FORM = { title: "", subtitle: "", searchQuery: "", productLimit: 6, order: 0, isActive: true };

// M15: admin CRUD for custom homepage heading-sections. Each section renders on
// the homepage as heading + N products from `searchQuery` + a "Show More" link
// to the search page.
const HomepageSectionsManagement = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: sections = [], isLoading, isError, error } = useQuery({
    queryKey: ["homepage-sections-admin"],
    queryFn: () => homepageSectionAPI.getAllHomepageSections().then((r) => r.data.data || []),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["homepage-sections-admin"] });
    queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => homepageSectionAPI.createHomepageSection(data),
    onSuccess: () => {
      invalidate();
      setIsCreateOpen(false);
      setForm(EMPTY_FORM);
      toast.success("Section created");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create section"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => homepageSectionAPI.updateHomepageSection(id, data),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast.success("Section updated");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update section"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => homepageSectionAPI.deleteHomepageSection(id),
    onSuccess: () => {
      invalidate();
      toast.success("Section deleted");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete section"),
  });

  const buildPayload = () => ({
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    searchQuery: form.searchQuery.trim(),
    productLimit: Number(form.productLimit) || 6,
    order: Number(form.order) || 0,
    isActive: form.isActive,
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.warning("Title is required");
    if (!form.searchQuery.trim()) return toast.warning("Search query is required");
    if (editing) updateMutation.mutate({ id: editing._id, data: buildPayload() });
    else createMutation.mutate(buildPayload());
  };

  const openEdit = (s) => {
    setForm({
      title: s.title || "",
      subtitle: s.subtitle || "",
      searchQuery: s.searchQuery || "",
      productLimit: s.productLimit ?? 6,
      order: s.order ?? 0,
      isActive: s.isActive !== false,
    });
    setEditing(s);
  };

  const formBody = (
    <form onSubmit={submit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="hs-title" className="text-gray-300">Heading *</Label>
        <Input
          id="hs-title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Hot RPG Deals"
          className="bg-secondary border-gray-700 text-white"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hs-subtitle" className="text-gray-300">Subtitle</Label>
        <Input
          id="hs-subtitle"
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          placeholder="Optional description under the heading"
          className="bg-secondary border-gray-700 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hs-query" className="text-gray-300">Search query *</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="hs-query"
            value={form.searchQuery}
            onChange={(e) => setForm((f) => ({ ...f, searchQuery: e.target.value }))}
            placeholder="e.g. rpg"
            className="bg-secondary border-gray-700 text-white pl-10"
            required
          />
        </div>
        <p className="text-xs text-gray-500">
          Products matching this search show in the section; “Show More” opens the search page for it.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hs-limit" className="text-gray-300">Products shown</Label>
          <Input
            id="hs-limit"
            type="number"
            min="1"
            max="12"
            value={form.productLimit}
            onChange={(e) => setForm((f) => ({ ...f, productLimit: e.target.value }))}
            className="bg-secondary border-gray-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hs-order" className="text-gray-300">Order</Label>
          <Input
            id="hs-order"
            type="number"
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
            className="bg-secondary border-gray-700 text-white"
          />
        </div>
      </div>
      <label htmlFor="hs-active" className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-700 bg-secondary/40 px-3 py-2.5">
        <input
          id="hs-active"
          type="checkbox"
          aria-label="Active (visible on homepage)"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="h-4 w-4 accent-accent"
        />
        <span className="text-sm text-gray-200">Active (visible on homepage)</span>
      </label>
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => { setIsCreateOpen(false); setEditing(null); }}
          className="flex-1 border-gray-700"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="flex-1 bg-accent hover:bg-blue-700"
        >
          {createMutation.isPending || updateMutation.isPending ? (
            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Saving...</>
          ) : editing ? (
            <><Edit className="mr-2 h-4 w-4" />Update Section</>
          ) : (
            <><Plus className="mr-2 h-4 w-4" />Create Section</>
          )}
        </Button>
      </div>
    </form>
  );

  if (isLoading) return <Loading message="Loading homepage sections..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading sections"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-accent/20 text-accent"><LayoutList className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Homepage Sections</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">
              Custom heading sections that show search-driven product rows on the homepage
            </p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (o) { setEditing(null); setForm(EMPTY_FORM); } }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700 shadow-lg shadow-accent/20">
              <Plus className="w-4 h-4 mr-2" />
              Create Section
            </Button>
          </DialogTrigger>
          <DialogContent size="sm" className="bg-primary border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">Create Homepage Section</DialogTitle>
              <DialogDescription className="text-gray-400">
                Heading + products from a search query, with a Show More link
              </DialogDescription>
            </DialogHeader>
            {formBody}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-primary border-gray-700 shadow-xl">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-white text-xl font-semibold">All Sections</CardTitle>
          <p className="text-sm text-gray-400 mt-1">{sections.length} section(s)</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-gray-300 font-semibold">Order</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Heading</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Search query</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Products</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Status</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.length > 0 ? (
                  sections.map((s) => (
                    <TableRow key={s._id} className="border-gray-700 hover:bg-secondary/20">
                      <TableCell className="text-gray-400">{s.order ?? 0}</TableCell>
                      <TableCell className="font-semibold text-white">
                        {s.title}
                        {s.subtitle && <p className="text-xs font-normal text-gray-400">{s.subtitle}</p>}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <code className="rounded bg-secondary/60 px-2 py-0.5 text-xs">{s.searchQuery}</code>
                      </TableCell>
                      <TableCell className="text-gray-400">{s.productLimit ?? 6}</TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? "success" : "secondary"}>
                          {s.isActive ? "Active" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(s)}
                            className="border-gray-700 hover:bg-blue-600/20"
                            title="Edit section"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(s._id)}
                            className="hover:bg-red-700"
                            title="Delete section"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmptyRow colSpan={6}>
                    <EmptyState
                      title="No sections yet"
                      description="Create your first custom homepage section"
                      className="py-0"
                    />
                  </TableEmptyRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent size="sm" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">Edit Homepage Section</DialogTitle>
            <DialogDescription className="text-gray-400">Update the section details</DialogDescription>
          </DialogHeader>
          {formBody}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomepageSectionsManagement;
