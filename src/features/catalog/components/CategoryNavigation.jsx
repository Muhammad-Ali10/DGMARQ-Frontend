import { useState, useEffect, useRef } from 'react';
import { cn } from '@lib/utils';

// Jump targets, in the order the sections appear on the homepage. Each id MUST
// match a section id in Home.jsx — two of these were previously typos
// ('Featured-products' vs featured-products, 'game-accounts' vs
// gaming-accounts) so those two links silently did nothing.
const menuItems = [
  { id: 'featured-products', label: 'Featured Products' },
  { id: 'bestsellers', label: 'Bestsellers' },
  { id: 'top-viewed', label: 'Top Viewed' },
  { id: 'gift-cards', label: 'Gift Cards' },
  { id: 'upcoming-games', label: 'Upcoming Games' },
  { id: 'upcoming-new-releases', label: 'Upcoming New Releases' },
  { id: 'software', label: 'Software' },
  { id: 'random-keys', label: 'Random Keys' },
  { id: 'gaming-accounts', label: 'Game Accounts' },
  { id: 'microsoft', label: 'Microsoft' },
];

const CategoryNavigation = ({ scrollOffset = 140 }) => {
  const [activeItem, setActiveItem] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(140);
  const navRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const calculateHeaderHeight = () => {
      const header =
        document.querySelector('[class*="sticky"][class*="z-50"]') ||
        document.querySelector('header') ||
        document.querySelector('[style*="sticky"]');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      } else {
        setHeaderHeight(scrollOffset);
      }
    };

    const timer = setTimeout(calculateHeaderHeight, 100);
    calculateHeaderHeight();
    window.addEventListener('resize', calculateHeaderHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateHeaderHeight);
    };
  }, [scrollOffset]);

  const scrollToSection = (sectionId) => {
    setIsScrolling(true);
    const element = document.getElementById(sectionId);
    if (element) {
      const totalOffset = headerHeight + 60;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - totalOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      setTimeout(() => {
        setActiveItem(sectionId);
        setIsScrolling(false);
      }, 500);
    } else {
      setIsScrolling(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling) return;

      const totalOffset = headerHeight + 60;
      const scrollPosition = window.scrollY + totalOffset + 50;

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
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headerHeight, isScrolling]);

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

  // M15: gentle auto-scroll (marquee) of the subcategory bar when it overflows.
  // Ping-pongs left↔right, pauses on hover/touch/focus so the user can read and
  // click, and respects prefers-reduced-motion.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return undefined;

    let raf;
    let dir = 1;
    let paused = false;
    const SPEED = 0.4; // px per frame ≈ 24px/s at 60fps

    const tick = () => {
      if (!paused) {
        const max = nav.scrollWidth - nav.clientWidth;
        if (max > 4) {
          nav.scrollLeft += dir * SPEED;
          if (nav.scrollLeft >= max - 1) dir = -1;
          else if (nav.scrollLeft <= 1) dir = 1;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    nav.addEventListener('mouseenter', pause);
    nav.addEventListener('mouseleave', resume);
    nav.addEventListener('touchstart', pause, { passive: true });
    nav.addEventListener('touchend', resume, { passive: true });
    nav.addEventListener('focusin', pause);
    nav.addEventListener('focusout', resume);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      nav.removeEventListener('mouseenter', pause);
      nav.removeEventListener('mouseleave', resume);
      nav.removeEventListener('touchstart', pause);
      nav.removeEventListener('touchend', resume);
      nav.removeEventListener('focusin', pause);
      nav.removeEventListener('focusout', resume);
    };
  }, []);

  return (
    <div className="w-full border-border">
      <div className="container mx-auto px-3 py-2.5">
        <div className="border border-border rounded-lg overflow-hidden">
          <nav
            ref={navRef}
            className="flex items-center overflow-x-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="flex items-center gap-0 px-3 py-2">
              {menuItems.map((item, index) => (
                <div key={item.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      'px-2 sm:px-2.5 py-1.5 sm:py-2 text-sm sm:text-base capitalize font-medium tracking-tight whitespace-nowrap transition-all duration-200',
                      'hover:text-accent-on-dark focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-[#07142E] rounded',
                      'touch-manipulation',
                      activeItem === item.id
                        ? 'text-accent-on-dark font-semibold'
                        : 'text-fg-muted hover:text-accent-on-dark'
                    )}
                    aria-label={`Scroll to ${item.label} section`}
                  >
                    {item.label}
                  </button>
                  {index < menuItems.length - 1 && (
                    <span className="text-fg-subtle mx-1 select-none">|</span>
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
