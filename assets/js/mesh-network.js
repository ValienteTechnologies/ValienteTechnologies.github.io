// Mesh Network Animation - Highly Optimized
(function() {
  'use strict';

  const canvas = document.getElementById('meshNetwork');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let mouse = { x: 0, y: 0 };
  let nodes = [];
  
  // Spatial grid for optimization
  let grid = null;
  let gridCellSize = 0;
  let gridCols = 0;
  let gridRows = 0;
  
  // Detect if desktop (screen width >= 768px)
  function isDesktop() {
    return window.innerWidth >= 768;
  }
  
  // Dynamic settings based on device
  function getNodeCount() {
    return isDesktop() ? 180 : 60;
  }
  
  function getConnectionDistance() {
    return isDesktop() ? 150 : 75;
  }
  
  const nodeRadius = 2;
  const lineWidth = 1;
  const nodeColor = 'rgba(255, 255, 255, 0.8)';
  const lineColor = 'rgba(255, 255, 255, 0.5)';
  const mouseNodeColor = 'rgba(255, 255, 255, 1)';
  const mouseLineColor = 'rgba(255, 255, 255, 0.7)';

  // Cache for connection distance squared
  let maxDistanceSquared = 0;
  let maxMouseDistanceSquared = 0;
  let maxDistance = 0;
  let maxMouseDistance = 0;

  // Initialize spatial grid
  function initGrid() {
    const maxDist = getConnectionDistance();
    gridCellSize = maxDist;
    gridCols = Math.ceil(canvas.width / gridCellSize) + 1;
    gridRows = Math.ceil(canvas.height / gridCellSize) + 1;
    grid = new Array(gridCols * gridRows);
    for (let i = 0; i < grid.length; i++) {
      grid[i] = [];
    }
  }

  // Get grid cell index from coordinates
  function getGridIndex(x, y) {
    const col = Math.floor(x / gridCellSize);
    const row = Math.floor(y / gridCellSize);
    return row * gridCols + col;
  }

  // Update spatial grid
  function updateGrid() {
    // Clear grid
    for (let i = 0; i < grid.length; i++) {
      grid[i].length = 0;
    }
    
    // Add nodes to grid (only to their primary cell for efficiency)
    const nodeCount = nodes.length;
    for (let i = 0; i < nodeCount; i++) {
      const node = nodes[i];
      const col = Math.floor(node.x / gridCellSize);
      const row = Math.floor(node.y / gridCellSize);
      
      if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
        grid[row * gridCols + col].push(i);
      }
    }
  }

  // Track previous canvas dimensions
  let prevCanvasWidth = 0;
  let prevCanvasHeight = 0;
  
  // Resize canvas to match header
  function resizeCanvas() {
    const header = canvas.parentElement;
    if (header) {
      const newWidth = header.offsetWidth;
      const newHeight = header.offsetHeight;
      
      // Check if dimensions actually changed significantly
      const widthChanged = Math.abs(newWidth - prevCanvasWidth) > 50;
      const heightChanged = Math.abs(newHeight - prevCanvasHeight) > 50;
      const shouldReinitNodes = widthChanged || heightChanged;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      prevCanvasWidth = newWidth;
      prevCanvasHeight = newHeight;
      
      // Update cached distances
      const maxDist = getConnectionDistance();
      maxDistance = maxDist;
      maxDistanceSquared = maxDist * maxDist;
      maxMouseDistance = maxDist * 1.5;
      maxMouseDistanceSquared = maxMouseDistance * maxMouseDistance;
      initGrid();
      
      return shouldReinitNodes;
    }
    return false;
  }

  // Initialize nodes - use typed arrays for better performance
  function initNodes() {
    nodes = [];
    const count = getNodeCount();
    const width = canvas.width;
    const height = canvas.height;
    
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: nodeRadius
      });
    }
    
    // Update cached distances
    const maxDist = getConnectionDistance();
    maxDistance = maxDist;
    maxDistanceSquared = maxDist * maxDist;
    maxMouseDistance = maxDist * 1.5;
    maxMouseDistanceSquared = maxMouseDistance * maxMouseDistance;
    initGrid();
    updateGrid();
  }

  // Update node positions - optimized
  function updateNodes() {
    const width = canvas.width;
    const height = canvas.height;
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off edges
      if (node.x < 0 || node.x > width) {
        node.vx *= -1;
        node.x = node.x < 0 ? 0 : width;
      }
      if (node.y < 0 || node.y > height) {
        node.vy *= -1;
        node.y = node.y < 0 ? 0 : height;
      }
    }
    
    // Update grid after node movement
    updateGrid();
  }

  // Fast inverse square root approximation (for distance calculations)
  function fastInvSqrt(x) {
    // Fast approximation: 1/sqrt(x) ≈ x^(-0.5)
    // For our use case, we can use a simple approximation
    return 1 / Math.sqrt(x);
  }

  // Draw connections between nodes - optimized with spatial grid
  function drawConnections() {
    const maxDistSq = maxDistanceSquared;
    const maxDist = maxDistance;
    const nodeCount = nodes.length;
    
    // Reuse connection arrays to avoid allocations
    const pathData = [];
    let pathIndex = 0;
    
    // Use spatial grid to only check nearby nodes
    // Check current cell and adjacent cells to catch edge cases
    const checkedPairs = new Set();
    
    for (let i = 0; i < nodeCount; i++) {
      const node1 = nodes[i];
      const col = Math.floor(node1.x / gridCellSize);
      const row = Math.floor(node1.y / gridCellSize);
      
      // Check current cell and adjacent cells (3x3 grid)
      for (let dr = 0; dr <= 1; dr++) {
        for (let dc = 0; dc <= 1; dc++) {
          const c = col + dc;
          const r = row + dr;
          if (c >= 0 && c < gridCols && r >= 0 && r < gridRows) {
            const nearbyNodes = grid[r * gridCols + c];
            
            for (let j = 0; j < nearbyNodes.length; j++) {
              const node2Idx = nearbyNodes[j];
              if (node2Idx <= i) continue; // Skip if already checked or same node
              
              const pairKey = i < node2Idx ? `${i},${node2Idx}` : `${node2Idx},${i}`;
              if (checkedPairs.has(pairKey)) continue;
              checkedPairs.add(pairKey);
              
              const node2 = nodes[node2Idx];
              const dx = node1.x - node2.x;
              const dy = node1.y - node2.y;
              const distSq = dx * dx + dy * dy;

              if (distSq < maxDistSq) {
                // Store path data directly (avoid object allocation)
                pathData[pathIndex++] = node1.x;
                pathData[pathIndex++] = node1.y;
                pathData[pathIndex++] = node2.x;
                pathData[pathIndex++] = node2.y;
              }
            }
          }
        }
      }
    }
    
    // Batch draw all connections
    if (pathIndex > 0) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = lineColor;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      
      for (let i = 0; i < pathIndex; i += 4) {
        ctx.moveTo(pathData[i], pathData[i + 1]);
        ctx.lineTo(pathData[i + 2], pathData[i + 3]);
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }

  // Draw connections to mouse - optimized
  function drawMouseConnections() {
    const maxDistSq = maxMouseDistanceSquared;
    const mouseX = mouse.x;
    const mouseY = mouse.y;
    
    // Get nearby nodes from grid
    const gridIdx = getGridIndex(mouseX, mouseY);
    const nearbyNodes = grid[gridIdx] || [];
    
    const pathData = [];
    let pathIndex = 0;
    
    // Check nodes in current and adjacent grid cells
    const col = Math.floor(mouseX / gridCellSize);
    const row = Math.floor(mouseY / gridCellSize);
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const c = col + dc;
        const r = row + dr;
        if (c >= 0 && c < gridCols && r >= 0 && r < gridRows) {
          const cellNodes = grid[r * gridCols + c];
          for (let i = 0; i < cellNodes.length; i++) {
            const nodeIdx = cellNodes[i];
            const node = nodes[nodeIdx];
            const dx = node.x - mouseX;
            const dy = node.y - mouseY;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxDistSq) {
              pathData[pathIndex++] = node.x;
              pathData[pathIndex++] = node.y;
            }
          }
        }
      }
    }
    
    if (pathIndex > 0) {
      ctx.lineWidth = lineWidth * 1.5;
      ctx.strokeStyle = mouseLineColor;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      
      for (let i = 0; i < pathIndex; i += 2) {
        ctx.moveTo(pathData[i], pathData[i + 1]);
        ctx.lineTo(mouseX, mouseY);
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }

  // Draw nodes - optimized with single path
  function drawNodes() {
    ctx.fillStyle = nodeColor;
    ctx.beginPath();
    
    const nodeCount = nodes.length;
    for (let i = 0; i < nodeCount; i++) {
      const node = nodes[i];
      ctx.moveTo(node.x + node.radius, node.y);
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    }
    
    ctx.fill();
  }

  // Draw mouse node
  function drawMouseNode() {
    ctx.fillStyle = mouseNodeColor;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, nodeRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animation loop - optimized with frame skipping for low-end devices
  let animationFrameId;
  let lastTime = 0;
  const targetFPS = 60;
  const frameInterval = 1000 / targetFPS;
  
  function animate(currentTime) {
    // Frame skipping for performance
    const deltaTime = currentTime - lastTime;
    if (deltaTime < frameInterval) {
      animationFrameId = requestAnimationFrame(animate);
      return;
    }
    lastTime = currentTime - (deltaTime % frameInterval);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateNodes();
    drawConnections();
    drawMouseConnections();
    drawNodes();
    drawMouseNode();
    
    animationFrameId = requestAnimationFrame(animate);
  }

  // Mouse move handler - optimized with throttling
  let mouseUpdateScheduled = false;
  function handleMouseMove(e) {
    if (mouseUpdateScheduled) return;
    mouseUpdateScheduled = true;
    
    requestAnimationFrame(() => {
      const header = canvas.parentElement;
      if (header) {
        const rect = header.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      mouseUpdateScheduled = false;
    });
  }

  // Touch move handler for mobile - optimized
  function handleTouchMove(e) {
    if (e.touches.length > 0 && !mouseUpdateScheduled) {
      mouseUpdateScheduled = true;
      requestAnimationFrame(() => {
        const header = canvas.parentElement;
        if (header) {
          const rect = header.getBoundingClientRect();
          mouse.x = e.touches[0].clientX - rect.left;
          mouse.y = e.touches[0].clientY - rect.top;
        }
        mouseUpdateScheduled = false;
      });
    }
  }

  // Initialize
  function init() {
    resizeCanvas();
    initNodes();
    
    // Set initial mouse position to center
    mouse.x = canvas.width / 2;
    mouse.y = canvas.height / 2;
    
    // Event listeners
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const shouldReinitNodes = resizeCanvas();
        if (shouldReinitNodes) {
          initNodes();
        } else {
          // Just update the grid for minor resizes
          updateGrid();
        }
      }, 250);
    }, { passive: true });
    
    // Track mouse over entire header, not just canvas
    const header = canvas.parentElement;
    if (header) {
      header.addEventListener('mousemove', handleMouseMove, { passive: true });
      header.addEventListener('touchmove', handleTouchMove, { passive: true });
    }
    
    // Start animation
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
  }

  // Cleanup function
  window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
