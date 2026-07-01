import { themeAPI } from "@services/api";
import TaxonomyManagementPage from "./taxonomy/TaxonomyManagementPage";

const config = {
  queryKey: "themes",
  itemsKey: "themes",
  hasSearch: true,
  hasStatusFilter: false,
  api: {
    list: (params) => themeAPI.getThemes(params),
    create: (data) => themeAPI.createTheme(data),
    update: (id, data) => themeAPI.updateTheme(id, data),
    remove: (id) => themeAPI.deleteTheme(id),
  },
  labels: {
    pageTitle: "Themes Management",
    pageSubtitle: "Manage game themes",
    createButton: "Create Theme",
    createDialogTitle: "Create New Theme",
    createDialogDescription: "Add a new game theme",
    listTitle: "All Themes",
    countNoun: "themes",
    noneFound: "No themes found",
    emptyHint: "Get started by creating your first theme",
    nameRequired: "Theme name is required",
    toastCreated: "Theme created successfully",
    toastCreateFailed: "Failed to create theme",
    toastUpdated: "Theme updated successfully",
    toastUpdateFailed: "Failed to update theme",
    toastDeleted: "Theme deleted successfully",
    toastDeleteFailed: "Failed to delete theme",
    loadingMessage: "Loading themes...",
    errorLoading: "Error loading themes",
    editDialogTitle: "Edit Theme",
    editDialogDescription: "Update theme information",
    updateButton: "Update Theme",
    editActionTitle: "Edit Theme",
    deleteActionTitle: "Delete Theme",
  },
};

const ThemesManagement = () => <TaxonomyManagementPage config={config} />;

export default ThemesManagement;
