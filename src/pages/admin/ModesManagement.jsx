import { modeAPI } from "@services/api";
import TaxonomyManagementPage from "./taxonomy/TaxonomyManagementPage";

const config = {
  queryKey: "modes",
  itemsKey: "modes",
  hasSearch: true,
  hasStatusFilter: true,
  api: {
    list: (params) => modeAPI.getModes(params),
    create: (data) => modeAPI.createMode(data),
    update: (id, data) => modeAPI.updateMode(id, data),
    toggleStatus: (id) => modeAPI.toggleModeStatus(id),
    remove: (id) => modeAPI.deleteMode(id),
  },
  labels: {
    pageTitle: "Modes Management",
    pageSubtitle: "Manage game modes",
    createButton: "Create Mode",
    createDialogTitle: "Create New Mode",
    createDialogDescription: "Add a new game mode",
    listTitle: "All Modes",
    countNoun: "modes",
    noneFound: "No modes found",
    emptyHint: "Get started by creating your first mode",
    nameRequired: "Mode name is required",
    toastCreated: "Mode created successfully",
    toastCreateFailed: "Failed to create mode",
    toastUpdated: "Mode updated successfully",
    toastUpdateFailed: "Failed to update mode",
    toastDeleted: "Mode deleted successfully",
    toastDeleteFailed: "Failed to delete mode",
    toastStatusUpdated: "Mode status updated successfully",
    loadingMessage: "Loading modes...",
    errorLoading: "Error loading modes",
    editDialogTitle: "Edit Mode",
    editDialogDescription: "Update mode information",
    updateButton: "Update Mode",
    editActionTitle: "Edit Mode",
    deleteActionTitle: "Delete Mode",
  },
};

const ModesManagement = () => <TaxonomyManagementPage config={config} />;

export default ModesManagement;
