import { deviceAPI } from "../../services/api";
import TaxonomyManagementPage from "./taxonomy/TaxonomyManagementPage";

const config = {
  queryKey: "devices",
  itemsKey: "devices",
  hasSearch: true,
  hasStatusFilter: true,
  api: {
    list: (params) => deviceAPI.getDevices(params),
    create: (data) => deviceAPI.createDevice(data),
    update: (id, data) => deviceAPI.updateDevice(id, data),
    toggleStatus: (id) => deviceAPI.toggleDeviceStatus(id),
    remove: (id) => deviceAPI.deleteDevice(id),
  },
  labels: {
    pageTitle: "Devices Management",
    pageSubtitle: "Manage gaming devices",
    createButton: "Create Device",
    createDialogTitle: "Create New Device",
    createDialogDescription: "Add a new gaming device",
    listTitle: "All Devices",
    countNoun: "devices",
    noneFound: "No devices found",
    emptyHint: "Get started by creating your first device",
    nameRequired: "Device name is required",
    toastCreated: "Device created successfully",
    toastCreateFailed: "Failed to create device",
    toastUpdated: "Device updated successfully",
    toastUpdateFailed: "Failed to update device",
    toastDeleted: "Device deleted successfully",
    toastDeleteFailed: "Failed to delete device",
    toastStatusUpdated: "Device status updated successfully",
    loadingMessage: "Loading devices...",
    errorLoading: "Error loading devices",
    editDialogTitle: "Edit Device",
    editDialogDescription: "Update device information",
    updateButton: "Update Device",
    editActionTitle: "Edit Device",
    deleteActionTitle: "Delete Device",
  },
};

const DevicesManagement = () => <TaxonomyManagementPage config={config} />;

export default DevicesManagement;
