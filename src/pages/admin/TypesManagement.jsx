import { typeAPI } from "../../services/api";
import TaxonomyManagementPage from "./taxonomy/TaxonomyManagementPage";

const config = {
  queryKey: "types",
  itemsKey: "types",
  hasSearch: true,
  hasStatusFilter: true,
  api: {
    list: (params) => typeAPI.getAllTypes(params),
    create: (data) => typeAPI.createType(data),
    update: (id, data) => typeAPI.updateType(id, data),
    toggleStatus: (id) => typeAPI.toggleTypeStatus(id),
    remove: (id) => typeAPI.deleteType(id),
  },
  labels: {
    pageTitle: "Product Types Management",
    pageSubtitle: "Manage product types",
    // Per-entity quirk: buttons say "Type" while dialogs/toasts say "Product Type"
    createButton: "Create Type",
    createDialogTitle: "Create New Product Type",
    createDialogDescription: "Add a new product type",
    listTitle: "All Product Types",
    countNoun: "types",
    noneFound: "No types found",
    emptyHint: "Get started by creating your first product type",
    nameRequired: "Product type name is required",
    toastCreated: "Product type created successfully",
    toastCreateFailed: "Failed to create product type",
    toastUpdated: "Product type updated successfully",
    toastUpdateFailed: "Failed to update product type",
    toastDeleted: "Product type deleted successfully",
    toastDeleteFailed: "Failed to delete product type",
    toastStatusUpdated: "Product type status updated successfully",
    loadingMessage: "Loading product types...",
    errorLoading: "Error loading product types",
    editDialogTitle: "Edit Product Type",
    editDialogDescription: "Update product type information",
    updateButton: "Update Type",
    editActionTitle: "Edit Type",
    deleteActionTitle: "Delete Type",
  },
};

const TypesManagement = () => <TaxonomyManagementPage config={config} />;

export default TypesManagement;
