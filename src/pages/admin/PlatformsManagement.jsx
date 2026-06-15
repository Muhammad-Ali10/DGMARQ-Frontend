import { platformAPI } from "../../services/api";
import TaxonomyManagementPage from "./taxonomy/TaxonomyManagementPage";

const config = {
  queryKey: "platforms",
  itemsKey: "platforms",
  // Per-entity quirk: the platforms list endpoint has no name search,
  // only the active-status filter.
  hasSearch: false,
  hasStatusFilter: true,
  api: {
    list: (params) => platformAPI.getAllPlatforms(params),
    create: (data) => platformAPI.createPlatform(data),
    update: (id, data) => platformAPI.updatePlatform(id, data),
    toggleStatus: (id) => platformAPI.togglePlatformStatus(id),
    remove: (id) => platformAPI.deletePlatform(id),
  },
  // Platform backend returns { total, page, limit, platforms } instead of
  // the aggregatePaginate shape, so pagination is derived manually.
  getPagination: (data) => ({
    page: data.page || 1,
    totalPages: Math.ceil((data.total || 0) / (data.limit || 10)),
    totalDocs: data.total || 0,
    limit: data.limit || 10,
    hasNextPage: (data.page || 1) * (data.limit || 10) < (data.total || 0),
    hasPrevPage: (data.page || 1) > 1,
  }),
  labels: {
    pageTitle: "Platforms Management",
    pageSubtitle: "Manage gaming platforms",
    createButton: "Create Platform",
    createDialogTitle: "Create New Platform",
    createDialogDescription: "Add a new gaming platform",
    listTitle: "All Platforms",
    countNoun: "platforms",
    noneFound: "No platforms found",
    emptyHint: "Get started by creating your first platform",
    nameRequired: "Platform name is required",
    toastCreated: "Platform created successfully",
    toastCreateFailed: "Failed to create platform",
    toastUpdated: "Platform updated successfully",
    toastUpdateFailed: "Failed to update platform",
    toastDeleted: "Platform deleted successfully",
    toastDeleteFailed: "Failed to delete platform",
    toastStatusUpdated: "Platform status updated successfully",
    loadingMessage: "Loading platforms...",
    errorLoading: "Error loading platforms",
    editDialogTitle: "Edit Platform",
    editDialogDescription: "Update platform information",
    updateButton: "Update Platform",
    editActionTitle: "Edit Platform",
    deleteActionTitle: "Delete Platform",
  },
};

const PlatformsManagement = () => <TaxonomyManagementPage config={config} />;

export default PlatformsManagement;
