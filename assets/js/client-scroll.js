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
    
    function checkImagesLoaded() {
      imagesLoaded++;
      if (imagesLoaded === images.length) {
        startScrolling();
      }
    }
    
    if (images.length === 0) {
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
      const scrollSpeed = isMobile ? 2.0 : 1.0; // Faster on mobile, smooth on desktop
      let animationFrameId;
      let direction = 1; // 1 for right, -1 for left
      
      // Sync scrollPosition with actual scroll position when user manually scrolls
      function syncScrollPosition() {
        scrollPosition = scrollingElement.scrollLeft;
      }
      
      // Listen for manual scroll events to keep scrollPosition in sync
      let scrollTimeout;
      scrollingElement.addEventListener('scroll', function() {
        // Only sync if auto-scroll is paused (user is manually scrolling)
        if (isPaused) {
          scrollPosition = scrollingElement.scrollLeft;
          
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
            
            // Determine scroll direction based on current position
            const maxScroll = scrollingElement.scrollWidth - scrollingElement.clientWidth;
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
          }, 300);
          // Resume after a delay
          touchTimeout = setTimeout(function() {
            scrollPosition = scrollingElement.scrollLeft;
            isPaused = false;
          }, 2000);
        }
      }, { passive: true });
      
      // Auto-scroll animation
      let lastTime = performance.now();
      
      function animate(currentTime = performance.now()) {
        if (!isPaused) {
          const maxScroll = scrollingElement.scrollWidth - scrollingElement.clientWidth;
          
          if (maxScroll > 0) {
            // Calculate delta time for frame-rate independent scrolling
            const deltaTime = currentTime - lastTime;
            const pixelsPerMs = scrollSpeed / 16.67; // Convert to pixels per millisecond (assuming 60fps baseline)
            const deltaScroll = pixelsPerMs * deltaTime * direction;
            
            scrollPosition += deltaScroll;
            
            // Reverse direction at boundaries for continuous loop
            if (scrollPosition >= maxScroll) {
              direction = -1;
              scrollPosition = maxScroll;
            } else if (scrollPosition <= 0) {
              direction = 1;
              scrollPosition = 0;
            }
            
            // Use requestAnimationFrame timing for smooth scrolling
            scrollingElement.scrollLeft = scrollPosition;
          }
        }
        
        lastTime = currentTime;
        animationFrameId = requestAnimationFrame(animate);
      }
      
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

