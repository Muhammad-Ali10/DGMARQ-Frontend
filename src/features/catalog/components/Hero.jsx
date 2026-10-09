import { useQuery } from '@tanstack/react-query';
import { Carousel, CarouselContent, CarouselItem } from '@components/ui/carousel';
import { Link } from 'react-router-dom';
import { homepageSliderAPI } from '@services/api';
import SafeImage from '@components/ui/safe-image';
import { resolveTarget } from '@lib/resolveTarget';

const Hero = () => {
  const { data: sliders, isLoading } = useQuery({
    queryKey: ['homepage-sliders', 'public'],
    queryFn: () => homepageSliderAPI.getHomepageSliders().then(res => res.data.data),
    staleTime: 180000,
  });

  if (isLoading) {
    return (
      <div className="w-full py-8 relative overflow-hidden">
        <div className="w-full max-w-1260 mx-auto flex items-end justify-center gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[180px] md:w-[259px] h-[280px] md:h-[349px] bg-surface-2 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!sliders || sliders.length === 0) {
    return null;
  }

  const sortedSliders = [...sliders].sort((a, b) => {
    const aIndex = a.slideIndex !== undefined ? a.slideIndex : a.order || 0;
    const bIndex = b.slideIndex !== undefined ? b.slideIndex : b.order || 0;
    return aIndex - bIndex;
  });
  const positionStyles = [
    { className: 'basis-auto p-0 z-10 md:-mr-6', size: 'w-[180px] md:w-[259px] h-[280px] md:h-[349px] mb-10' },
    { className: 'basis-auto p-0 z-20 md:-mr-20', size: 'w-[180px] md:w-[285px] h-[280px] md:h-[382px] mb-6' },
    { className: 'basis-auto p-0 z-30', size: 'w-[220px] md:w-[409px] h-[320px] md:h-[529px]' },
    { className: 'basis-auto p-0 z-20 md:-ml-20', size: 'w-[180px] md:w-[285px] h-[280px] md:h-[382px] mb-6' },
    { className: 'basis-auto p-0 z-10 md:-ml-6', size: 'w-[180px] md:w-[259px] h-[280px] md:h-[349px] mb-10' },
  ];

  return (
    <div className="w-full py-8 relative overflow-hidden">
      <Carousel className="w-full mx-auto">
        <CarouselContent className="flex items-end justify-center">
          {sortedSliders.map((slider, index) => {
            const position = slider.slideIndex !== undefined ? slider.slideIndex : slider.order || index;
            const style = positionStyles[position] || positionStyles[0];
            const isCenter = position === 2;
            const product = slider.productId;
            const slideHref = product?._id
              ? `/product/${product.slug || product._id}`
              : resolveTarget(slider.target);

            const slideContent = (
              <div className={`${style.size} rounded-2xl overflow-hidden ${isCenter ? 'shadow-xl' : 'shadow-lg'} relative transition-transform duration-300 ease-out group-hover:scale-105 group-hover:shadow-2xl`}>
                <div className="relative h-full">
                  <SafeImage
                    src={slider.image}
                    alt={slider.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    w={410}
                  />
                </div>
              </div>
            );

            return (
              <CarouselItem key={slider._id} className={`${style.className} group cursor-pointer hover:z-40`}>
                {slideHref ? <Link to={slideHref}>{slideContent}</Link> : slideContent}
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default Hero;

