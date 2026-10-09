import { useState } from "react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { regionAPI } from "@services/api";
import { EmptyState, TableEmptyRow } from "@components/common/EmptyState";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
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
import { Loading, ErrorMessage } from "@components/ui/loading";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { SearchInput } from "@components/common/SearchInput";
import { Pagination } from "@components/common/Pagination";
import ConfirmationModal from "@components/common/ConfirmationModal";
import { useDebounce } from "@hooks/useDebounce";

const EMPTY_FORM = { name: "" };

const RegionForm = ({ formData, setFormData, onSubmit, onCancel, submitting, submitLabel, submitIcon }) => (
  <form onSubmit={onSubmit} className="space-y-4 mt-4">
    <div className="space-y-2">
      <Label htmlFor="region-name" className="text-gray-300">
        Name *
      </Label>
      <Input
        id="region-name"
        value={formData.name}
        onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
        className="bg-secondary border-gray-700 text-white"
        required
      />
    </div>

    <div className="flex gap-3 pt-2">
      <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-gray-700">
        Cancel
      </Button>
      <Button type="submit" disabled={submitting} className="flex-1 bg-accent hover:bg-blue-700">
        {submitting ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            {submitIcon}
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  </form>
);

const RegionsManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 350);
  const [pendingDelete, setPendingDelete] = useState(null);
  const queryClient = useQueryClient();

  const { data: itemsData, isLoading, isError, error } = useQuery({
    queryKey: ["regions", page, search],
    queryFn: () => {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      return regionAPI.getRegions(params).then((res) => res.data.data);
    },
    placeholderData: keepPreviousData,
  });

  const regions = itemsData?.docs || [];
  const pagination = {
    page: itemsData?.page || 1,
    totalPages: itemsData?.totalPages || 1,
    totalDocs: itemsData?.totalDocs || 0,
    limit: itemsData?.limit || 10,
  };

  const createMutation = useMutation({
    mutationFn: (data) => regionAPI.createRegion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      setIsCreateOpen(false);
      setFormData(EMPTY_FORM);
      setPage(1);
      toast.success("Region created successfully");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create region"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => regionAPI.updateRegion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      setIsEditOpen(false);
      setSelectedItem(null);
      toast.success("Region updated successfully");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update region"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => regionAPI.deleteRegion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      if (regions.length === 1 && page > 1) setPage(page - 1);
      toast.success("Region deleted successfully");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete region"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.warning("Region name is required");
    createMutation.mutate({ name: formData.name.trim() });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.warning("Region name is required");
    updateMutation.mutate({ id: selectedItem._id, data: { name: formData.name.trim() } });
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setFormData({ name: item.name });
    setIsEditOpen(true);
  };

  if (isLoading && !itemsData) return <Loading message="Loading regions..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading regions"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Regions Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">
            Product region tags (name-only taxonomy)
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (o) setFormData(EMPTY_FORM); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700 shadow-lg shadow-accent/20">
              <Plus className="w-4 h-4 mr-2" />
              Create Region
            </Button>
          </DialogTrigger>
          <DialogContent size="sm" className="">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">Create New Region</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a product region tag
              </DialogDescription>
            </DialogHeader>
            <RegionForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
              submitting={createMutation.isPending}
              submitLabel="Create Region"
              submitIcon={<Plus className="mr-2 h-4 w-4" />}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card variant="hud">
        <CardHeader className="border-b ">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>All Regions</CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {pagination.totalDocs > 0
                  ? `${pagination.totalDocs} region(s)`
                  : "No regions found"}
              </p>
            </div>
            <div className="px-3 py-1.5 bg-secondary/50 rounded-lg border border-gray-700 text-sm">
              <span className="text-gray-400">Page </span>
              <span className="text-white font-semibold">{pagination.page}</span>
              <span className="text-gray-400"> of </span>
              <span className="text-white font-semibold">{pagination.totalPages}</span>
            </div>
          </div>

          <SearchInput
            value={searchInput}
            onChange={(value) => { setSearchInput(value); setPage(1); }}
            onClear={() => { setSearchInput(""); setPage(1); }}
            placeholder="Search by name..."
            className="mt-6"
          />
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table variant="hud">
              <TableHeader>
                <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-gray-300 font-semibold">Name</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Created Date</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.length > 0 ? (
                  regions.map((item) => (
                    <TableRow key={item._id} className="border-gray-700 hover:bg-secondary/20">
                      <TableCell className="font-semibold text-white">{item.name}</TableCell>
                      <TableCell className="text-gray-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(item)}
                            className="border-gray-700 hover:bg-blue-600/20"
                            title="Edit Region"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setPendingDelete(item)}
                            className="hover:bg-red-700"
                            title="Delete Region"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmptyRow colSpan={3}>
                    <EmptyState
                      title="No regions found"
                      description={searchInput ? "Try adjusting your search" : "Get started by creating your first region"}
                      className="py-0"
                    />
                  </TableEmptyRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination variant="numbered" page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent size="sm" className="">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">Edit Region</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the region name
            </DialogDescription>
          </DialogHeader>
          <RegionForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditOpen(false)}
            submitting={updateMutation.isPending}
            submitLabel="Update Region"
            submitIcon={<Edit className="mr-2 h-4 w-4" />}
          />
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Delete region?"
        description={`"${pendingDelete?.name || ""}" will be permanently deleted. This cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate(pendingDelete._id)}
      />
    </div>
  );
};

export default RegionsManagement;
