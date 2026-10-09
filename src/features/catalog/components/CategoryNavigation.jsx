import { useState, useEffect, useRef } from 'react';
import { cn } from '@lib/utils';

const DEFERRED_SECTIONS_ANCHOR = 'home-deferred-sections';

const menuItems = [
  { id: 'featured-products', label: 'Featured Products' },
  { id: 'bestsellers', label: 'Bestsellers' },
  { id: 'top-viewed', label: 'Top Viewed' },
  { id: 'gift-cards', label: 'Gift Cards' },
  { id: 'upcoming-games', label: 'Upcoming Games', deferred: true },
  { id: 'microsoft', label: 'Microsoft', deferred: true },
];

const DEFERRED_RETRY_MS = 150;
const DEFERRED_RETRIES = 12;

const CategoryNavigation = ({ scrollOffset = 140 }) => {
  const [activeItem, setActiveItem] = useState('');
  const [headerHeight, setHeaderHeight] = useState(140);
  const navRef = useRef(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const calculateHeaderHeight = () => {
      const header =
        document.querySelector('[class*="sticky"][class*="z-50"]') ||
        document.querySelector('header') ||
        document.querySelector('[style*="sticky"]');
      setHeaderHeight(header ? header.offsetHeight : scrollOffset);
    };

    const timer = setTimeout(calculateHeaderHeight, 100);
    calculateHeaderHeight();
    window.addEventListener('resize', calculateHeaderHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateHeaderHeight);
    };
  }, [scrollOffset]);

  const scrollToElement = (element) => {
    const top = element.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 60);
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const scrollToSection = (item) => {
    isScrollingRef.current = true;
    const settle = () => {
      setActiveItem(item.id);
      setTimeout(() => { isScrollingRef.current = false; }, 500);
    };

    const element = document.getElementById(item.id);
    if (element) {
      scrollToElement(element);
      settle();
      return;
    }

    const anchor = item.deferred && document.getElementById(DEFERRED_SECTIONS_ANCHOR);
    if (!anchor) {
      isScrollingRef.current = false;
      return;
    }
    scrollToElement(anchor);
    let attempts = 0;
    const retry = () => {
      const target = document.getElementById(item.id);
      if (target) {
        scrollToElement(target);
        settle();
      } else if (++attempts < DEFERRED_RETRIES) {
        setTimeout(retry, DEFERRED_RETRY_MS);
      } else {
        isScrollingRef.current = false;
      }
    };
    setTimeout(retry, DEFERRED_RETRY_MS);
  };

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (isScrollingRef.current) return;
      const line = headerHeight + 110;
      for (let i = menuItems.length - 1; i >= 0; i--) {
        const rect = document.getElementById(menuItems[i].id)?.getBoundingClientRect();
        if (rect && rect.top <= line && rect.bottom > line) {
          setActiveItem(menuItems[i].id);
          return;
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [headerHeight]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return undefined;

    let raf = 0;
    let dir = 1;
    let paused = false;
    const SPEED = 0.4;
    const overflow = () => nav.scrollWidth - nav.clientWidth;

    const tick = () => {
      raf = 0;
      const max = overflow();
      if (paused || max <= 4) return;
      nav.scrollLeft += dir * SPEED;
      if (nav.scrollLeft >= max - 1) dir = -1;
      else if (nav.scrollLeft <= 1) dir = 1;
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && !paused && overflow() > 4) raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      paused = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const resume = () => {
      paused = false;
      start();
    };

    nav.addEventListener('mouseenter', pause);
    nav.addEventListener('mouseleave', resume);
    nav.addEventListener('touchstart', pause, { passive: true });
    nav.addEventListener('touchend', resume, { passive: true });
    nav.addEventListener('focusin', pause);
    nav.addEventListener('focusout', resume);
    window.addEventListener('resize', start);
    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      nav.removeEventListener('mouseenter', pause);
      nav.removeEventListener('mouseleave', resume);
      nav.removeEventListener('touchstart', pause);
      nav.removeEventListener('touchend', resume);
      nav.removeEventListener('focusin', pause);
      nav.removeEventListener('focusout', resume);
      window.removeEventListener('resize', start);
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
                    onClick={() => scrollToSection(item)}
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
