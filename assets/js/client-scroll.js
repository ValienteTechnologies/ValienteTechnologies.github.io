// Auto-scroll for clients/references section
(function() {
  'use strict';
  
  function initClientScroll() {
    const scrollingElement = document.getElementById('scrolling-clients');
    if (!scrollingElement) return;
    
    // Randomize client order (Fisher-Yates shuffle)
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    
    // Get all client elements
    const clientElements = Array.from(scrollingElement.children);
    if (clientElements.length > 0) {
      // Shuffle and re-append in random order
      const shuffled = shuffleArray([...clientElements]);
      shuffled.forEach(function(element) {
        scrollingElement.appendChild(element);
      });
    }
    
    // Wait for images to load to get accurate scroll width
    const images = scrollingElement.querySelectorAll('img');
    let imagesLoaded = 0;
    let scrollingStarted = false;
    
    function checkImagesLoaded() {
      imagesLoaded++;
      if (imagesLoaded === images.length && !scrollingStarted) {
        scrollingStarted = true;
        startScrolling();
      }
    }
    
    // Fallback: start scrolling after 500ms even if images aren't fully loaded
    const fallbackTimeout = setTimeout(function() {
      if (!scrollingStarted) {
        scrollingStarted = true;
        startScrolling();
      }
    }, 500);
    
    if (images.length === 0) {
      clearTimeout(fallbackTimeout);
      startScrolling();
    } else {
      images.forEach(function(img) {
        if (img.complete) {
          checkImagesLoaded();
        } else {
          img.addEventListener('load', checkImagesLoaded);
          img.addEventListener('error', checkImagesLoaded);
        }
      });
    }
    
    function startScrolling() {
      let scrollPosition = 0;
      let isPaused = false;
      // Detect mobile/touch devices for faster scrolling
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const scrollSpeed = isMobile ? 3.0 : 1.0; // Faster on mobile, smooth on desktop
      let animationFrameId;
      let direction = 1; // 1 for right, -1 for left
      
      // Cache max scroll to avoid recalculating every frame
      let maxScroll = scrollingElement.scrollWidth - scrollingElement.clientWidth;
      let maxScrollCacheTime = performance.now();
      const MAX_SCROLL_CACHE_DURATION = 1000; // Recalculate max scroll every 1 second
      
      // Helper to recalculate max scroll when needed
      function updateMaxScroll() {
        const now = performance.now();
        if (now - maxScrollCacheTime > MAX_SCROLL_CACHE_DURATION) {
          maxScroll = scrollingElement.scrollWidth - scrollingElement.clientWidth;
          maxScrollCacheTime = now;
        }
      }
      
      // Sync scrollPosition with actual scroll position when user manually scrolls
      function syncScrollPosition() {
        scrollPosition = scrollingElement.scrollLeft;
        updateMaxScroll(); // Update cache on manual scroll
      }
      
      // Throttled scroll handler to reduce overhead
      let scrollTimeout;
      let lastScrollTime = 0;
      const SCROLL_THROTTLE = 16; // ~60fps
      
      scrollingElement.addEventListener('scroll', function() {
        // Only sync if auto-scroll is paused (user is manually scrolling)
        if (isPaused) {
          const now = performance.now();
          if (now - lastScrollTime >= SCROLL_THROTTLE) {
            scrollPosition = scrollingElement.scrollLeft;
            lastScrollTime = now;
            updateMaxScroll();
          }
          
          // Clear existing timeout
          if (scrollTimeout) {
            clearTimeout(scrollTimeout);
          }
          
          // Sync again after scroll ends (for momentum scrolling)
          scrollTimeout = setTimeout(syncScrollPosition, 100);
        }
      }, { passive: true });
      
      // Pause on hover
      scrollingElement.addEventListener('mouseenter', function() {
        isPaused = true;
      });
      
      scrollingElement.addEventListener('mouseleave', function() {
        // Sync scroll position before resuming
        scrollPosition = scrollingElement.scrollLeft;
        updateMaxScroll(); // Update cache on resume
        isPaused = false;
      });
      
      // Pause on touch/swipe for mobile devices
      let touchTimeout;
      let isTouching = false;
      let touchStartX = 0;
      let touchStartY = 0;
      let lastTouchX = 0;
      let lastTouchY = 0;
      
      scrollingElement.addEventListener('touchstart', function(e) {
        isTouching = true;
        isPaused = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        lastTouchX = touchStartX;
        lastTouchY = touchStartY;
        
        // Clear any existing timeout
        if (touchTimeout) {
          clearTimeout(touchTimeout);
        }
      }, { passive: true });
      
      scrollingElement.addEventListener('touchmove', function(e) {
        if (isTouching) {
          lastTouchX = e.touches[0].clientX;
          lastTouchY = e.touches[0].clientY;
          
          // Clear any existing timeout since user is actively scrolling
          if (touchTimeout) {
            clearTimeout(touchTimeout);
          }
        }
      }, { passive: true });
      
      scrollingElement.addEventListener('touchend', function(e) {
        if (isTouching) {
          isTouching = false;
          
          // Sync scroll position with actual scroll position after user stops swiping
          // Wait for momentum scrolling to settle
          setTimeout(function() {
            scrollPosition = scrollingElement.scrollLeft;
            updateMaxScroll(); // Update cache after touch
            
            // Determine scroll direction based on current position
            if (scrollPosition >= maxScroll - 1) {
              direction = -1; // At end, go left
            } else if (scrollPosition <= 1) {
              direction = 1; // At start, go right
            } else {
              // Determine direction based on which boundary is closer
              direction = (scrollPosition > maxScroll / 2) ? -1 : 1;
            }
          }, 300);
          
          // Determine if this was a horizontal swipe (more horizontal than vertical)
          const deltaX = Math.abs(lastTouchX - touchStartX);
          const deltaY = Math.abs(lastTouchY - touchStartY);
          
          // Only resume auto-scroll if it was a horizontal swipe
          // Wait 2 seconds after touch ends before resuming auto-scroll
          touchTimeout = setTimeout(function() {
            // Final sync before resuming
            scrollPosition = scrollingElement.scrollLeft;
            updateMaxScroll(); // Update cache before resuming
            isPaused = false;
          }, 2000);
        }
      }, { passive: true });
      
      // Also handle touchcancel event
      scrollingElement.addEventListener('touchcancel', function(e) {
        if (isTouching) {
          isTouching = false;
          if (touchTimeout) {
            clearTimeout(touchTimeout);
          }
          // Sync scroll position
          setTimeout(function() {
            scrollPosition = scrollingElement.scrollLeft;
            updateMaxScroll(); // Update cache
          }, 300);
          // Resume after a delay
          touchTimeout = setTimeout(function() {
            scrollPosition = scrollingElement.scrollLeft;
            updateMaxScroll(); // Update cache
            isPaused = false;
          }, 2000);
        }
      }, { passive: true });
      
      // Auto-scroll animation
      let lastTime = performance.now();
      let frameCount = 0;
      
      function animate(currentTime = performance.now()) {
        // Skip frames if paused to save CPU
        if (!isPaused) {
          // Update max scroll cache periodically (every 60 frames ~1 second at 60fps)
          frameCount++;
          if (frameCount % 60 === 0) {
            updateMaxScroll();
          }
          
          if (maxScroll > 0) {
            // Clamp deltaTime to prevent large jumps when tab becomes active again
            const deltaTime = Math.min(currentTime - lastTime, 100); // Cap at 100ms
            const pixelsPerMs = scrollSpeed / 16.67; // Convert to pixels per millisecond (assuming 60fps baseline)
            const deltaScroll = pixelsPerMs * deltaTime * direction;
            
            scrollPosition += deltaScroll;
            
            // Reverse direction at boundaries for continuous loop
            if (scrollPosition >= maxScroll) {
              direction = -1;
              scrollPosition = maxScroll;
              updateMaxScroll(); // Update cache on boundary hit
            } else if (scrollPosition <= 0) {
              direction = 1;
              scrollPosition = 0;
              updateMaxScroll(); // Update cache on boundary hit
            }
            
            // Use requestAnimationFrame timing for smooth scrolling
            // Use requestAnimationFrame to batch scroll updates
            scrollingElement.scrollLeft = scrollPosition;
          }
        }
        
        lastTime = currentTime;
        animationFrameId = requestAnimationFrame(animate);
      }
      
      // Pause when tab is hidden (Page Visibility API)
      let wasPausedByVisibility = false;
      function handleVisibilityChange() {
        if (document.hidden) {
          if (!isPaused) {
            wasPausedByVisibility = true;
            isPaused = true;
          }
        } else {
          if (wasPausedByVisibility) {
            scrollPosition = scrollingElement.scrollLeft;
            updateMaxScroll();
            isPaused = false;
            wasPausedByVisibility = false;
          }
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Start animation
      animate();
      
      // Clean up on page unload
      window.addEventListener('beforeunload', function() {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        if (touchTimeout) {
          clearTimeout(touchTimeout);
        }
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      });
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClientScroll);
  } else {
    initClientScroll();
  }
})();

