import { useQuery } from '@tanstack/react-query';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';
import { Link } from 'react-router-dom';
import { homepageSliderAPI } from '../services/api';

const Hero = () => {
  const { data: sliders, isLoading } = useQuery({
    queryKey: ['homepage-sliders'],
    queryFn: () => homepageSliderAPI.getHomepageSliders().then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="w-full py-8 relative overflow-hidden">
        <div className="w-full max-w-1260 mx-auto flex items-end justify-center gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[180px] md:w-[259px] h-[280px] md:h-[349px] bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!sliders || sliders.length === 0) {
    return null; // Don't show slider if no slides
  }


  // Sort sliders by slideIndex (0-4)
  const sortedSliders = [...sliders].sort((a, b) => {
    const aIndex = a.slideIndex !== undefined ? a.slideIndex : a.order || 0;
    const bIndex = b.slideIndex !== undefined ? b.slideIndex : b.order || 0;
    return aIndex - bIndex;
  });

  // Map positions to styles
  const positionStyles = [
    // Position 0 - Left Small
    { className: 'basis-auto p-0 z-10 md:-mr-6', size: 'w-[180px] md:w-[259px] h-[280px] md:h-[349px] mb-10' },
    // Position 1 - Left Medium
    { className: 'basis-auto p-0 z-20 md:-mr-20', size: 'w-[180px] md:w-[285px] h-[280px] md:h-[382px] mb-6' },
    // Position 2 - Center Featured
    { className: 'basis-auto p-0 z-30', size: 'w-[220px] md:w-[409px] h-[320px] md:h-[529px]' },
    // Position 3 - Right Medium
    { className: 'basis-auto p-0 z-20 md:-ml-20', size: 'w-[180px] md:w-[285px] h-[280px] md:h-[382px] mb-6' },
    // Position 4 - Right Small
    { className: 'basis-auto p-0 z-10 md:-ml-6', size: 'w-[180px] md:w-[259px] h-[280px] md:h-[349px] mb-10' },
  ];

  return (
    <div className="w-full py-8 relative overflow-hidden">
      <Carousel className="w-full  mx-auto">
        <CarouselContent className="flex items-end justify-center">
          {sortedSliders.map((slider, index) => {
            const position = slider.slideIndex !== undefined ? slider.slideIndex : slider.order || index;
            const style = positionStyles[position] || positionStyles[0];
            const isCenter = position === 2;
            const hasProduct = slider.productId && slider.productId._id;
            const product = slider.productId;

            const slideContent = (
              <div className={`${style.size} rounded-2xl overflow-hidden ${isCenter ? 'shadow-xl' : 'shadow-lg'} relative`}>
                <div className="relative h-full">
                  <img
                    src={slider.image}
                    alt={slider.title}
                    className="w-full h-full object-cover"
                  />
                  {isCenter && hasProduct && (
                    <div className="absolute bottom-0 left-0 w-full bg-blue-800/95 p-4">
                      <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded inline-block mb-2">
                        New Release
                      </div>
                      <h2 className="text-white font-bold text-lg md:text-2xl leading-tight mb-1">
                        {product.name?.toUpperCase() || slider.title}
                      </h2>
                      <p className="text-gray-300 text-xs md:text-sm">
                        {product.platform?.name || 'Steam'} · {product.region?.name || 'Global'} · {product.type?.name || 'Key/Account'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );

            return (
              <CarouselItem key={slider._id} className={style.className}>
                {hasProduct ? (
                  <Link to={`/product/${product.slug || product._id}`}>
                    {slideContent}
                  </Link>
                ) : (
                  slideContent
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default Hero;

