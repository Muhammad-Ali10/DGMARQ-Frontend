import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
import { Loading } from "./ui/loading";
import { Button } from "./ui/button";
import { userAPI } from "../services/api";
import { Link } from "react-router-dom";
const FavoriteItems = () => {
    const { data, isPending, error } = useQuery({
        queryKey: ["wishlist", "home"],
        queryFn: async () => {
            const response = await userAPI.getWishlist();
            return response.data;
        },
        retry: false,
        // Don't refetch on mount if user is not authenticated
        enabled: true, // Will fail gracefully if not authenticated
    });

    const FavoritesProduct = data?.data?.products || [];
    
    // Extract the actual product objects from the wishlist structure
    const products = FavoritesProduct.map(item => item.productId).filter(Boolean).slice(0, 6);
    
    // Don't show the section if there's an auth error or no products
    const shouldShow = !error || (error?.response?.status !== 401 && error?.response?.status !== 403);

    return (
        <div className="flex flex-col items-center max-w-1260 w-full mx-auto px-4 pt-12 gap-6">
            <div className="flex flex-col text-white font-poppins gap-2.5">
                <h3 className="text-4xl -tracking-tight font-semibold text-center">Our customers' favorite items</h3>
                <p className="text-base font-normal -tracking-tight text-center">Gift cards, gaming NFTs, and other digital goodies for all the cryptocurrency enthusiasts.</p>
            </div>
            <div className="flex flex-row flex-wrap justify-center items-center w-full gap-2.5 md:gap-[15px]">
                {isPending ? (
                    <div className="flex justify-center items-center py-12 w-full">
                        <Loading message="Loading favorite items..." />
                    </div>
                ) : !shouldShow || error ? (
                    null // Don't render anything if there's an auth error
                ) : products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))
                ) : (
                    <div className="text-center py-12 w-full">
                        <p className="text-gray-400">No favorite items available at the moment.</p>
                    </div>
                )}
            </div>

            <Link to="/wishlist">
                <Button className="text-base font-normal font-poppins tracking-tight text-[#F05F00] bg-[#F05F00]/10 border border-[#F05F00] hover:bg-[#F05F00]/20">
                    Show More
                </Button>
            </Link>
        </div>
    );
};

export default FavoriteItems;
