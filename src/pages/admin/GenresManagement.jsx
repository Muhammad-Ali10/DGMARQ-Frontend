import { genreAPI } from "../../services/api";
import TaxonomyManagementPage from "./taxonomy/TaxonomyManagementPage";

const config = {
  queryKey: "genres",
  itemsKey: "genres",
  hasSearch: true,
  hasStatusFilter: false,
  api: {
    list: (params) => genreAPI.getGenres(params),
    create: (data) => genreAPI.createGenre(data),
    update: (id, data) => genreAPI.updateGenre(id, data),
    remove: (id) => genreAPI.deleteGenre(id),
  },
  labels: {
    pageTitle: "Genres Management",
    pageSubtitle: "Manage game genres",
    createButton: "Create Genre",
    createDialogTitle: "Create New Genre",
    createDialogDescription: "Add a new game genre",
    listTitle: "All Genres",
    countNoun: "genres",
    noneFound: "No genres found",
    emptyHint: "Get started by creating your first genre",
    nameRequired: "Genre name is required",
    toastCreated: "Genre created successfully",
    toastCreateFailed: "Failed to create genre",
    toastUpdated: "Genre updated successfully",
    toastUpdateFailed: "Failed to update genre",
    toastDeleted: "Genre deleted successfully",
    toastDeleteFailed: "Failed to delete genre",
    loadingMessage: "Loading genres...",
    errorLoading: "Error loading genres",
    editDialogTitle: "Edit Genre",
    editDialogDescription: "Update genre information",
    updateButton: "Update Genre",
    editActionTitle: "Edit Genre",
    deleteActionTitle: "Delete Genre",
  },
};

const GenresManagement = () => <TaxonomyManagementPage config={config} />;

export default GenresManagement;
