import { regionAPI } from "@services/api";
import TaxonomyManagementPage from "./taxonomy/TaxonomyManagementPage";

const config = {
  queryKey: "regions",
  itemsKey: "regions",
  hasSearch: true,
  hasStatusFilter: false,
  api: {
    list: (params) => regionAPI.getRegions(params),
    create: (data) => regionAPI.createRegion(data),
    update: (id, data) => regionAPI.updateRegion(id, data),
    remove: (id) => regionAPI.deleteRegion(id),
  },
  labels: {
    pageTitle: "Regions Management",
    pageSubtitle: "Manage game regions",
    createButton: "Create Region",
    createDialogTitle: "Create New Region",
    createDialogDescription: "Add a new game region",
    listTitle: "All Regions",
    countNoun: "regions",
    noneFound: "No regions found",
    emptyHint: "Get started by creating your first region",
    nameRequired: "Region name is required",
    toastCreated: "Region created successfully",
    toastCreateFailed: "Failed to create region",
    toastUpdated: "Region updated successfully",
    toastUpdateFailed: "Failed to update region",
    toastDeleted: "Region deleted successfully",
    toastDeleteFailed: "Failed to delete region",
    loadingMessage: "Loading regions...",
    errorLoading: "Error loading regions",
    editDialogTitle: "Edit Region",
    editDialogDescription: "Update region information",
    updateButton: "Update Region",
    editActionTitle: "Edit Region",
    deleteActionTitle: "Delete Region",
  },
};

const RegionsManagement = () => <TaxonomyManagementPage config={config} />;

export default RegionsManagement;
