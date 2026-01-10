import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trendingCategoryAPI, categoryAPI } from '../../services/api';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Save } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';

const TrendingCategoriesManagement = () => {
  const queryClient = useQueryClient();

  const { data: trendingCategories, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trending-categories'],
    queryFn: () => trendingCategoryAPI.getAllTrendingCategories().then(res => res.data.data),
  });

  const { data: allCategoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getCategories({ page: 1, limit: 1000 }).then(res => res.data.data),
  });
  const allCategories = allCategoriesData?.docs || allCategoriesData?.categories || [];

  const updateMutation = useMutation({
    mutationFn: (data) => trendingCategoryAPI.updateTrendingCategories(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['trending-categories']);
      showSuccess('Trending categories updated successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to update trending categories');
    },
  });

  const [selectedCategories, setSelectedCategories] = useState(() => {
    // Initialize from current trending categories when data loads
    return [];
  });

  // Update selectedCategories when trendingCategories loads
  useEffect(() => {
    if (trendingCategories?.categories) {
      const ids = trendingCategories.categories.map((cat) => cat._id);
      setSelectedCategories(ids);
    }
  }, [trendingCategories]);

  const handleToggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = () => {
    updateMutation.mutate({ categoryIds: selectedCategories });
  };

  if (isLoadingTrending || isLoadingCategories) return <Loading message="Loading..." />;
  if (!trendingCategories || !allCategories) return <ErrorMessage message="Error loading data" />;

  const currentTrendingIds = trendingCategories?.categories?.map((cat) => cat._id) || [];
  const displayCategories = allCategories || [];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Trending Categories Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Select categories to feature as trending</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-accent hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Select Trending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayCategories.map((category) => {
              const isSelected = selectedCategories.includes(category._id) || currentTrendingIds.includes(category._id);
              return (
                <div
                  key={category._id}
                  onClick={() => handleToggleCategory(category._id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent/10'
                      : 'border-gray-700 bg-secondary hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {category.image && (
                      <img src={category.image} alt={category.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white">{category.name}</p>
                      <p className="text-sm text-gray-400">{category.description || 'No description'}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCategory(category._id)}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {displayCategories.length === 0 && (
            <div className="text-center text-gray-400 py-8">No categories available</div>
          )}
        </CardContent>
      </Card>

      {trendingCategories?.categories?.length > 0 && (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Current Trending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trendingCategories.categories.map((category) => (
                <div
                  key={category._id}
                  className="px-4 py-2 bg-accent/20 border border-accent rounded-full text-white"
                >
                  {category.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrendingCategoriesManagement;

