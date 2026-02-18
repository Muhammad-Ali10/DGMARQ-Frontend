import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

// Menu items configuration - easily scalable
const menuItems = [
  { id: 'bestsellers', label: 'Bestsellers' },
  { id: 'upcoming-games', label: 'Upcoming Games' },
  { id: 'upcoming-new-releases', label: 'Upcoming New Releases' },
  { id: 'Featured-products', label: 'Featured Products' },
  { id: 'trending-categories', label: 'Trending Categories' },
  { id: 'software', label: 'Software' },
  { id: 'gaming-gift-cards', label: 'Gaming Gift Cards' },
  { id: 'random-keys', label: 'Random Keys' },
  { id: 'game-accounts', label: 'Game Accounts' },
  { id: 'microsoft', label: 'Microsoft' },
]; 

const CategoryNavigation = ({ scrollOffset = 140 }) => {
  const [activeItem, setActiveItem] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(140);
  const navRef = useRef(null);
  const observerRef = useRef(null);

  // Calculate header height dynamically
  useEffect(() => {
    const calculateHeaderHeight = () => {
      // Look for the header element (sticky element with z-50)
      const header = document.querySelector('[class*="sticky"][class*="z-50"]') ||
                     document.querySelector('header') ||
                     document.querySelector('[style*="sticky"]');
      if (header) {
        const height = header.offsetHeight;
        setHeaderHeight(height);
      } else {
        // Fallback: use scrollOffset prop or default
        setHeaderHeight(scrollOffset);
      }
    };

    // Calculate after a short delay to ensure DOM is ready
    const timer = setTimeout(calculateHeaderHeight, 100);
    calculateHeaderHeight(); // Also try immediately
    
    window.addEventListener('resize', calculateHeaderHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateHeaderHeight);
    };
  }, [scrollOffset]);

  // Handle smooth scroll to section
  const scrollToSection = (sectionId) => {
    setIsScrolling(true);
    const element = document.getElementById(sectionId);
    if (element) {
      // Account for both header and navigation bar height
      const totalOffset = headerHeight + 60; // 60px for the nav bar itself
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - totalOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // Update active item after scroll
      setTimeout(() => {
        setActiveItem(sectionId);
        setIsScrolling(false);
      }, 500);
    } else {
      setIsScrolling(false);
    }
  };

  // Track which section is currently in view
  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling) return;

      const totalOffset = headerHeight + 60;
      const scrollPosition = window.scrollY + totalOffset + 50;

      // Find the section that's currently in view
      for (let i = menuItems.length - 1; i >= 0; i--) {
        const element = document.getElementById(menuItems[i].id);
        if (element) {
          const elementTop = element.offsetTop;
          const elementBottom = elementTop + element.offsetHeight;

          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setActiveItem(menuItems[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headerHeight, isScrolling]);

  // Intersection Observer for better active state detection
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrolling) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveItem(entry.target.id);
          }
        });
      },
      {
        rootMargin: `-${headerHeight + 60}px 0px -50% 0px`,
        threshold: 0.1,
      }
    );

    // Observe all sections
    menuItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [headerHeight, isScrolling]);

  return (
    <div className="w-full  border-gray-700">
      <div className="container mx-auto px-3 py-2.5">
        {/* Rounded container with border */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <nav
            ref={navRef}
            className="flex items-center overflow-x-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="flex items-center gap-0  px-3 py-2">
              {menuItems.map((item, index) => (
                <div key={item.id} className="flex items-center">
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      'px-2 sm:px-2.5 py-1.5 sm:py-2 text-sm sm:text-base capitalize font-medium tracking-tight whitespace-nowrap transition-all duration-200',
                      'hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-[#07142E] rounded',
                      'touch-manipulation', // Better touch handling on mobile
                      activeItem === item.id
                        ? 'text-accent font-semibold'
                        : 'text-gray-300 hover:text-accent'
                    )}
                    aria-label={`Scroll to ${item.label} section`}
                  >
                    {item.label}
                  </button>
                  {index < menuItems.length - 1 && (
                    <span className="text-gray-600 mx-1 select-none">|</span>
                  )}
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>

    </div>
  );
};

export default CategoryNavigation;

