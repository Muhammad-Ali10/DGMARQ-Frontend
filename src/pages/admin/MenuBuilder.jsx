import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { menuAPI } from "@services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Loading } from "@components/ui/loading";
import { ErrorState } from "@components/common/ErrorState";
import { EmptyState } from "@components/common/EmptyState";
import TargetPicker from "@components/common/TargetPicker";
import { IconPicker } from "@components/common/IconPicker";
import { getMenuIcon } from "@lib/menuIcons";
import { describeTarget } from "@lib/resolveTarget";
import { cn } from "@lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ListTree,
  Wand2,
} from "lucide-react";

const BUILT_IN_ITEM_COUNT = 5;
const COMFORTABLE_ITEM_TOTAL = 7;

const LEVEL_COPY = {
  item: {
    title: "Menu item",
    hint: "A button in the header bar. Add headings under it to make it a dropdown, or leave it empty for a plain link.",
  },
  heading: {
    title: "Column heading",
    hint: "A column inside the dropdown panel. Point it at a category to make the heading clickable — then use “Add all subcategories” to fill the column in one click.",
  },
  link: {
    title: "Link",
    hint: "A row under the heading. This is what the buyer clicks.",
  },
};

const EMPTY_FORM = { label: "", icon: "", target: null, viewAllTarget: null, isActive: true, source: "manual" };

const SOURCES = [
  {
    id: "auto-categories",
    label: "Automatic",
    hint: "Fills itself with every category and its subcategories. New categories appear on their own — nothing to maintain.",
  },
  {
    id: "manual",
    label: "Build it myself",
    hint: "You add each column and link by hand. Use this for groupings that are not just your categories.",
  },
];

const MenuBuilder = () => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState({});
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: tree = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["menu-admin"],
    queryFn: () => menuAPI.getMenuAdmin().then((r) => r.data.data || []),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["menu-admin"] });
    queryClient.invalidateQueries({ queryKey: ["header-menu"] });
  };

  const closeDialog = () => {
    setDialog(null);
    setForm(EMPTY_FORM);
  };

  const createMutation = useMutation({
    mutationFn: (data) => menuAPI.createMenuItem(data),
    onSuccess: () => {
      invalidate();
      closeDialog();
      toast.success("Added to the menu");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not add that"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => menuAPI.updateMenuItem(id, data),
    onSuccess: () => {
      invalidate();
      closeDialog();
      toast.success("Menu updated");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not save that"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => menuAPI.deleteMenuItem(id),
    onSuccess: (res) => {
      invalidate();
      const removed = res?.data?.data?.deleted ?? 1;
      toast.success(removed > 1 ? `Deleted, along with ${removed - 1} nested row(s)` : "Deleted");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not delete that"),
  });

  const reorderMutation = useMutation({
    mutationFn: (items) => menuAPI.reorderMenu(items),
    onSuccess: invalidate,
    onError: (err) => toast.error(err?.response?.data?.message || "Could not reorder"),
  });

  const fillMutation = useMutation({
    mutationFn: (headingId) => menuAPI.fillSubcategories(headingId),
    onSuccess: (res) => {
      invalidate();
      toast.success(res?.data?.message || "Subcategories added");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not add subcategories"),
  });

  const openCreate = (level, parentId = null) => {
    setForm(EMPTY_FORM);
    setDialog({ mode: "create", level, parentId });
  };

  const openEdit = (node) => {
    setForm({
      label: node.label || "",
      icon: node.icon || "",
      target: node.target || null,
      viewAllTarget: node.viewAllTarget || null,
      isActive: node.isActive !== false,
      source: node.source || "manual",
    });
    setDialog({ mode: "edit", level: node.level, node });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.label.trim()) {
      toast.error("Give it a name first");
      return;
    }
    if (dialog.level === "link" && !form.target?.value) {
      toast.error("A link needs somewhere to go — pick a target");
      return;
    }

    if (dialog.mode === "edit") {
      updateMutation.mutate({ id: dialog.node._id, data: form });
    } else {
      createMutation.mutate({ ...form, level: dialog.level, parent: dialog.parentId });
    }
  };

  const isAuto = (node) => node.source === "auto-categories";

  const move = (siblings, index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= siblings.length) return;
    const reordered = [...siblings];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reorderMutation.mutate(reordered.map((node, i) => ({ id: node._id, order: i })));
  };

  const totalHeaderItems = BUILT_IN_ITEM_COUNT + tree.filter((i) => i.isActive !== false).length;
  const overCapacity = totalHeaderItems > COMFORTABLE_ITEM_TOTAL;

  const dialogCopy = dialog ? LEVEL_COPY[dialog.level] : null;
  const saving = createMutation.isPending || updateMutation.isPending;

  const rowActions = (node, siblings, index, children) => (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        aria-label="Move up"
        disabled={index === 0 || reorderMutation.isPending}
        onClick={() => move(siblings, index, -1)}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        aria-label="Move down"
        disabled={index === siblings.length - 1 || reorderMutation.isPending}
        onClick={() => move(siblings, index, 1)}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Edit" onClick={() => openEdit(node)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-destructive hover:text-destructive"
        aria-label="Delete"
        onClick={() => {
          const extra = children?.length
            ? `\n\nEverything inside it (${children.length} row(s) and their links) will be deleted too.`
            : "";
          if (window.confirm(`Delete “${node.label}”?${extra}`)) deleteMutation.mutate(node._id);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const content = useMemo(() => {
    if (isLoading) return <Loading message="Loading menu…" />;
    if (isError) return <ErrorState error={error} onRetry={refetch} />;
    if (tree.length === 0) {
      return (
        <EmptyState
          icon={ListTree}
          title="No custom menu items yet"
          description="The header is showing its five built-in entries. Add an item to put your own dropdown next to them."
          action={
            <Button onClick={() => openCreate("item")}>
              <Plus className="mr-2 h-4 w-4" /> Add menu item
            </Button>
          }
        />
      );
    }

    return (
      <div className="space-y-3">
        {tree.map((item, itemIndex) => {
          const Icon = getMenuIcon(item.icon);
          const isOpen = expanded[item._id] !== false;
          const headings = item.children || [];

          return (
            <div key={item._id} className="rounded-xl border border-border bg-secondary/30">
              <div className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [item._id]: !isOpen }))}
                  className="shrink-0 text-fg-muted hover:text-fg"
                  aria-label={isOpen ? "Collapse" : "Expand"}
                  aria-expanded={isOpen}
                >
                  <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
                </button>
                <Icon className="h-5 w-5 shrink-0 text-accent-on-dark" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{item.label}</p>
                  <p className="truncate text-xs text-fg-muted">
                    {headings.length > 0
                      ? `Dropdown · ${headings.length} column${headings.length === 1 ? "" : "s"}`
                      : "Plain link"}
                    {" · "}
                    {describeTarget(item.target)}
                  </p>
                </div>
                {isAuto(item) && <Badge className="shrink-0">Automatic</Badge>}
                {item.isActive === false && <Badge variant="secondary">Hidden</Badge>}
                {rowActions(item, tree, itemIndex, headings)}
              </div>

              {isOpen && isAuto(item) && (
                <div className="border-t border-border px-3 pb-3 pt-3">
                  <p className="mb-3 text-xs text-fg-muted">
                    Filled automatically from your categories — {headings.length} column
                    {headings.length === 1 ? "" : "s"}. Add or rename a category and this
                    updates on its own. Edit the icons and names under Categories &
                    Subcategories.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {headings.map((heading) => (
                      <span
                        key={heading._id}
                        className="rounded-md border border-border px-2 py-1 text-xs text-fg-muted"
                      >
                        {heading.label}
                        <span className="ml-1 text-fg-subtle">({heading.children?.length || 0})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isOpen && !isAuto(item) && (
                <div className="space-y-2 border-t border-border px-3 pb-3 pt-3">
                  {headings.map((heading, headingIndex) => {
                    const links = heading.children || [];
                    return (
                      <div key={heading._id} className="rounded-lg border border-border/60 bg-surface-sunken/40">
                        <div className="flex items-center gap-3 p-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-fg">{heading.label}</p>
                            <p className="truncate text-xs text-fg-muted">
                              {links.length} link{links.length === 1 ? "" : "s"}
                              {heading.target?.value && ` · ${describeTarget(heading.target)}`}
                            </p>
                          </div>
                          {heading.target?.type === "category" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0"
                              disabled={fillMutation.isPending}
                              onClick={() => fillMutation.mutate(heading._id)}
                            >
                              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                              Add all subcategories
                            </Button>
                          )}
                          {heading.isActive === false && <Badge variant="secondary">Hidden</Badge>}
                          {rowActions(heading, headings, headingIndex, links)}
                        </div>

                        <div className="space-y-1 border-t border-border/60 px-2.5 py-2">
                          {links.map((link, linkIndex) => (
                            <div key={link._id} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary/40">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-fg">{link.label}</p>
                                <p className="truncate text-xs text-fg-subtle">{describeTarget(link.target)}</p>
                              </div>
                              {link.isActive === false && <Badge variant="secondary">Hidden</Badge>}
                              {rowActions(link, links, linkIndex, null)}
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-fg-muted"
                            onClick={() => openCreate("link", heading._id)}
                          >
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add link
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <Button variant="outline" size="sm" onClick={() => openCreate("heading", item._id)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add column heading
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, isLoading, isError, error, expanded, reorderMutation.isPending, fillMutation.isPending]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-fg">
            <ListTree className="h-6 w-6 text-accent-on-dark" />
            Header Menu
          </h1>
          <p className="text-sm text-fg-muted">
            Build your own dropdowns for the header. These appear after the five built-in entries.
          </p>
        </div>
        <Button onClick={() => openCreate("item")}>
          <Plus className="mr-2 h-4 w-4" /> Add menu item
        </Button>
      </div>

      {overCapacity && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            The header bar is showing {totalHeaderItems} items ({BUILT_IN_ITEM_COUNT} built-in +{" "}
            {totalHeaderItems - BUILT_IN_ITEM_COUNT} custom). Items share the bar equally, so past{" "}
            {COMFORTABLE_ITEM_TOTAL} the labels get tight on screens under 1280px. Mobile is unaffected.
          </span>
        </div>
      )}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-fg">Menu structure</CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>

      <Dialog open={!!dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "edit" ? "Edit" : "Add"} {dialogCopy?.title.toLowerCase()}
            </DialogTitle>
            <DialogDescription>{dialogCopy?.hint}</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menu-label">Name</Label>
              <Input
                id="menu-label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder={dialog?.level === "link" ? "Netflix" : "Subscriptions"}
                className="bg-secondary border-border text-fg"
              />
            </div>

            {dialog?.level === "item" && (
              <div className="space-y-2">
                <Label>What goes inside it</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SOURCES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setForm({ ...form, source: option.id })}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        form.source === option.id
                          ? "border-accent bg-accent/15"
                          : "border-border hover:border-accent/50"
                      )}
                    >
                      <p className="text-sm font-semibold text-fg">{option.label}</p>
                      <p className="mt-1 text-xs text-fg-muted">{option.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dialog?.level !== "link" && (
              <div className="space-y-2">
                <Label>Icon {dialog?.level === "heading" && "(optional)"}</Label>
                <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
              </div>
            )}

            <TargetPicker
              value={form.target}
              onChange={(target) => setForm({ ...form, target })}
              label={
                dialog?.level === "link"
                  ? "Where this link goes"
                  : dialog?.level === "heading"
                    ? "Category this column represents (optional)"
                    : "Where this item goes (optional)"
              }
            />

            <div className="flex items-center gap-2">
              <Checkbox
                id="menu-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked === true })}
              />
              <Label htmlFor="menu-active" className="text-sm text-fg">
                Visible on the site
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : dialog?.mode === "edit" ? "Save changes" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuBuilder;
