import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
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
import { Badge } from "@components/ui/badge";
import { Loading, ErrorMessage } from "@components/ui/loading";
import {
  Plus,
  Edit,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { SearchInput } from "@components/common/SearchInput";

// Default pagination extractor for backends using aggregatePaginate
// ({ docs, totalDocs, page, totalPages, ... }). Entities with a different
// response shape (e.g. platforms) supply config.getPagination instead.
const defaultGetPagination = (data) => ({
  page: data.page || 1,
  totalPages: data.totalPages || 1,
  totalDocs: data.totalDocs || 0,
  limit: data.limit || 10,
  hasNextPage: data.hasNextPage || false,
  hasPrevPage: data.hasPrevPage || false,
});

const EMPTY_PAGINATION = {
  page: 1,
  totalPages: 1,
  totalDocs: 0,
  limit: 10,
  hasNextPage: false,
  hasPrevPage: false,
};

const TaxonomyManagementPage = ({ config }) => {
  const { queryKey: entityKey, itemsKey, hasSearch, hasStatusFilter, api, labels } = config;
  const hasToggleStatus = Boolean(api.toggleStatus);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const queryClient = useQueryClient();

  const {
    data: itemsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    // Query key shape matches the original per-entity pages exactly:
    // search / isActive segments only exist where the feature exists.
    queryKey: [
      entityKey,
      page,
      ...(hasSearch ? [search] : []),
      ...(hasStatusFilter ? [isActiveFilter] : []),
    ],
    queryFn: () => {
      const params = { page, limit: 10 };
      if (hasSearch && search.trim()) params.search = search.trim();
      if (hasStatusFilter && isActiveFilter !== "") params.isActive = isActiveFilter;
      return api.list(params).then((res) => res.data.data);
    },
    keepPreviousData: true,
  });

  const items = itemsData?.docs || itemsData?.[itemsKey] || [];
  const getPagination = config.getPagination || defaultGetPagination;
  const pagination = itemsData ? getPagination(itemsData) : EMPTY_PAGINATION;

  const createMutation = useMutation({
    mutationFn: (data) => api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityKey] });
      setIsCreateOpen(false);
      setFormData({ name: "" });
      setPage(1);
      toast.success(labels.toastCreated);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || labels.toastCreateFailed);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityKey] });
      setIsEditOpen(false);
      setSelectedItem(null);
      toast.success(labels.toastUpdated);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || labels.toastUpdateFailed);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => api.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityKey] });
      toast.success(labels.toastStatusUpdated);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityKey] });
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      }
      toast.success(labels.toastDeleted);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || labels.toastDeleteFailed);
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.warning(labels.nameRequired);
      return;
    }
    createMutation.mutate({ name: formData.name.trim() });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.warning(labels.nameRequired);
      return;
    }
    updateMutation.mutate({
      id: selectedItem._id,
      data: { name: formData.name.trim() },
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleFilterChange = (value) => {
    setIsActiveFilter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setIsActiveFilter("");
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(
      1,
      pagination.page - Math.floor(maxPagesToShow / 2)
    );
    let endPage = Math.min(
      pagination.totalPages,
      startPage + maxPagesToShow - 1
    );

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          size="sm"
          variant={i === pagination.page ? "default" : "outline"}
          onClick={() => handlePageChange(i)}
          className={i === pagination.page ? "bg-accent hover:bg-blue-700" : ""}
        >
          {i}
        </Button>
      );
    }
    return pages;
  };

  // Empty-state hint mirrors each original page's wording, which depended on
  // which of search / status-filter the page offered.
  const hasActiveFilters = Boolean(
    (hasSearch && search) || (hasStatusFilter && isActiveFilter)
  );
  let adjustHint = "Try adjusting your search criteria";
  if (hasSearch && hasStatusFilter) {
    adjustHint = "Try adjusting your search or filter criteria";
  } else if (!hasSearch && hasStatusFilter) {
    adjustHint = "Try adjusting your filter criteria";
  }

  if (isLoading && !itemsData) return <Loading message={labels.loadingMessage} />;
  if (isError)
    return (
      <ErrorMessage
        message={error?.response?.data?.message || labels.errorLoading}
      />
    );

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{labels.pageTitle}</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">{labels.pageSubtitle}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700 shadow-lg shadow-accent/20">
              <Plus className="w-4 h-4 mr-2" />
              {labels.createButton}
            </Button>
          </DialogTrigger>
          <DialogContent size="sm" className="">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">
                {labels.createDialogTitle}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {labels.createDialogDescription}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-accent hover:bg-blue-700"
                >
                  {createMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {labels.createButton}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card variant="hud">
        <CardHeader className="border-b ">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>
                {labels.listTitle}
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {pagination.totalDocs > 0 ? (
                  <>
                    Showing{" "}
                    <span className="text-white font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="text-white font-medium">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.totalDocs
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="text-white font-medium">
                      {pagination.totalDocs}
                    </span>{" "}
                    {labels.countNoun}
                  </>
                ) : (
                  labels.noneFound
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="px-3 py-1.5 bg-secondary/50 rounded-lg border border-gray-700">
                <span className="text-gray-400">Page </span>
                <span className="text-white font-semibold">
                  {pagination.page}
                </span>
                <span className="text-gray-400"> of </span>
                <span className="text-white font-semibold">
                  {pagination.totalPages}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {hasSearch && (
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  onClear={() => { setSearch(''); setPage(1); }}
                  placeholder="Search by name..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="border-gray-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>
            )}
            {hasStatusFilter && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <select
                  value={isActiveFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="w-full sm:w-48 px-10 py-2 bg-secondary border border-gray-700 rounded-md text-white appearance-none cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>
            )}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="border-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table variant="hud">
              <TableHeader>
                <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-gray-300 font-semibold">
                    Name
                  </TableHead>
                  {hasToggleStatus && (
                    <TableHead className="text-gray-300 font-semibold">
                      Status
                    </TableHead>
                  )}
                  <TableHead className="text-gray-300 font-semibold">
                    Created Date
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items && items.length > 0 ? (
                  items.map((item) => (
                    <TableRow
                      key={item._id}
                      className="border-gray-700 hover:bg-secondary/20"
                    >
                      <TableCell className="font-semibold text-white">
                        {item.name}
                      </TableCell>
                      {hasToggleStatus && (
                        <TableCell>
                          <Badge
                            variant={item.isActive ? "success" : "destructive"}
                            className="font-medium"
                          >
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-gray-400">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item);
                              setFormData({ name: item.name });
                              setIsEditOpen(true);
                            }}
                            className="border-gray-700 hover:bg-blue-600/20"
                            title={labels.editActionTitle}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {hasToggleStatus && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                toggleStatusMutation.mutate(item._id)
                              }
                              className={`border-gray-700 ${
                                item.isActive
                                  ? "hover:bg-orange-600/20"
                                  : "hover:bg-green-600/20"
                              }`}
                              title={item.isActive ? "Deactivate" : "Activate"}
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              deleteMutation.mutate(item._id);
                            }}
                            className="hover:bg-red-700"
                            title={labels.deleteActionTitle}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={hasToggleStatus ? 4 : 3}
                      className="text-center py-12"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <p className="text-gray-400 font-medium">
                          {labels.noneFound}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {hasActiveFilters ? adjustHint : labels.emptyHint}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {(pagination.totalDocs ?? 0) > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-700 px-6 pb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || isLoading}
                  className="border-gray-700"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex gap-1">{renderPageNumbers()}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || isLoading}
                  className="border-gray-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent size="sm" className="">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">
              {labels.editDialogTitle}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {labels.editDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-300">
                Name *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                className="bg-secondary border-gray-700 text-white"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 border-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-accent hover:bg-blue-700"
              >
                {updateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    {labels.updateButton}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxonomyManagementPage;
