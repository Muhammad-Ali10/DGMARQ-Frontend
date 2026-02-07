import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { modeAPI } from "../../services/api";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Loading, ErrorMessage } from "../../components/ui/loading";
import {
  Plus,
  Edit,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Filter,
  RefreshCw,
} from "lucide-react";

const ModesManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const queryClient = useQueryClient();

  const {
    data: modesData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["modes", page, search, isActiveFilter],
    queryFn: () => {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (isActiveFilter !== "") params.isActive = isActiveFilter;
      return modeAPI.getModes(params).then((res) => res.data.data);
    },
    keepPreviousData: true,
  });

  const modes = modesData?.docs || modesData?.modes || [];
  const pagination = modesData
    ? {
        page: modesData.page || 1,
        totalPages: modesData.totalPages || 1,
        totalDocs: modesData.totalDocs || 0,
        limit: modesData.limit || 10,
        hasNextPage: modesData.hasNextPage || false,
        hasPrevPage: modesData.hasPrevPage || false,
      }
    : {
        page: 1,
        totalPages: 1,
        totalDocs: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
      };

  const createMutation = useMutation({
    mutationFn: (data) => modeAPI.createMode(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["modes"]);
      setIsCreateOpen(false);
      setFormData({ name: "" });
      setPage(1);
      toast.success("Mode created successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create mode");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ modeId, data }) => modeAPI.updateMode(modeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["modes"]);
      setIsEditOpen(false);
      setSelectedMode(null);
      toast.success("Mode updated successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update mode");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (modeId) => modeAPI.toggleModeStatus(modeId),
    onSuccess: () => {
      queryClient.invalidateQueries(["modes"]);
      toast.success("Mode status updated successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (modeId) => modeAPI.deleteMode(modeId),
    onSuccess: () => {
      queryClient.invalidateQueries(["modes"]);
      if (modes.length === 1 && page > 1) setPage(page - 1);
      toast.success("Mode deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete mode");
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.warning("Mode name is required");
      return;
    }
    createMutation.mutate({ name: formData.name.trim() });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.warning("Mode name is required");
      return;
    }
    updateMutation.mutate({
      modeId: selectedMode._id,
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

  if (isLoading && !modesData) return <Loading message="Loading modes..." />;
  if (isError)
    return (
      <ErrorMessage
        message={error?.response?.data?.message || "Error loading modes"}
      />
    );

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Modes Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage game modes</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700 shadow-lg shadow-accent/20">
              <Plus className="w-4 h-4 mr-2" />
              Create Mode
            </Button>
          </DialogTrigger>
          <DialogContent size="sm" className="bg-primary border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">
                Create New Mode
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new game mode
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
                      Create Mode
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-primary border-gray-700 shadow-xl">
        <CardHeader className="border-b border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-white text-xl font-semibold">
                All Modes
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
                    modes
                  </>
                ) : (
                  "No modes found"
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
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <Input
                  type="text"
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-secondary border-gray-700 text-white pl-10 pr-10 focus:ring-2 focus:ring-accent/50"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
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
            {(search || isActiveFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setIsActiveFilter("");
                  setPage(1);
                }}
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
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-gray-300 font-semibold">
                    Name
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    Created Date
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modes && modes.length > 0 ? (
                  modes.map((mode) => (
                    <TableRow
                      key={mode._id}
                      className="border-gray-700 hover:bg-secondary/20"
                    >
                      <TableCell className="font-semibold text-white">
                        {mode.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={mode.isActive ? "success" : "destructive"}
                          className="font-medium"
                        >
                          {mode.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {mode.createdAt
                          ? new Date(mode.createdAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMode(mode);
                              setFormData({ name: mode.name });
                              setIsEditOpen(true);
                            }}
                            className="border-gray-700 hover:bg-blue-600/20"
                            title="Edit Mode"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toggleStatusMutation.mutate(mode._id)
                            }
                            className={`border-gray-700 ${
                              mode.isActive
                                ? "hover:bg-orange-600/20"
                                : "hover:bg-green-600/20"
                            }`}
                            title={mode.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                                deleteMutation.mutate(mode._id);
                            }}
                            className="hover:bg-red-700"
                            title="Delete Mode"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <p className="text-gray-400 font-medium">
                          No modes found
                        </p>
                        <p className="text-gray-500 text-sm">
                          {search || isActiveFilter
                            ? "Try adjusting your search or filter criteria"
                            : "Get started by creating your first mode"}
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
        <DialogContent size="sm" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">
              Edit Mode
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Update mode information
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
                    Update Mode
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

export default ModesManagement;
