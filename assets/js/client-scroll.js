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
      const scrollSpeed = 0.5; // pixels per frame (slower for smoother effect)
      let animationFrameId;
      let direction = 1; // 1 for right, -1 for left
      
      // Pause on hover
      scrollingElement.addEventListener('mouseenter', function() {
        isPaused = true;
      });
      
      scrollingElement.addEventListener('mouseleave', function() {
        isPaused = false;
      });
      
      // Auto-scroll animation
      function animate() {
        if (!isPaused) {
          const maxScroll = scrollingElement.scrollWidth - scrollingElement.clientWidth;
          
          if (maxScroll > 0) {
            scrollPosition += scrollSpeed * direction;
            
            // Reverse direction at boundaries for continuous loop
            if (scrollPosition >= maxScroll) {
              direction = -1;
              scrollPosition = maxScroll;
            } else if (scrollPosition <= 0) {
              direction = 1;
              scrollPosition = 0;
            }
            
            scrollingElement.scrollLeft = scrollPosition;
          }
        }
        
        animationFrameId = requestAnimationFrame(animate);
      }
      
      // Start animation
      animate();
      
      // Clean up on page unload
      window.addEventListener('beforeunload', function() {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
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

