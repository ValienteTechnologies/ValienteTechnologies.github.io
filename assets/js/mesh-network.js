// Mesh Network Animation
(function() {
  'use strict';

  const canvas = document.getElementById('meshNetwork');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let mouse = { x: 0, y: 0 };
  let nodes = [];
  const nodeCount = 50;
  const connectionDistance = 150;
  const nodeRadius = 2;
  const lineWidth = 1;
  const nodeColor = 'rgba(255, 255, 255, 0.8)';
  const lineColor = 'rgba(255, 255, 255, 0.2)';
  const mouseNodeColor = 'rgba(255, 255, 255, 1)';
  const mouseLineColor = 'rgba(255, 255, 255, 0.4)';

  // Resize canvas to match header
  function resizeCanvas() {
    const header = canvas.parentElement;
    if (header) {
      canvas.width = header.offsetWidth;
      canvas.height = header.offsetHeight;
    }
  }

  // Initialize nodes
  function initNodes() {
    nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: nodeRadius
      });
    }
  }

  // Update node positions
  function updateNodes() {
    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off edges
      if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

      // Keep nodes within bounds
      node.x = Math.max(0, Math.min(canvas.width, node.x));
      node.y = Math.max(0, Math.min(canvas.height, node.y));
    });
  }

  // Draw connections between nodes
  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          const opacity = 1 - (distance / connectionDistance);
          ctx.strokeStyle = lineColor.replace('0.2', opacity.toString());
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
  }

  // Draw connections to mouse
  function drawMouseConnections() {
    nodes.forEach(node => {
      const dx = node.x - mouse.x;
      const dy = node.y - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < connectionDistance * 1.5) {
        const opacity = (1 - (distance / (connectionDistance * 1.5))) * 0.4;
        ctx.strokeStyle = mouseLineColor.replace('0.4', opacity.toString());
        ctx.lineWidth = lineWidth * 1.5;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    });
  }

  // Draw nodes
  function drawNodes() {
    nodes.forEach(node => {
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Draw mouse node
  function drawMouseNode() {
    ctx.fillStyle = mouseNodeColor;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, nodeRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateNodes();
    drawConnections();
    drawMouseConnections();
    drawNodes();
    drawMouseNode();
    
    requestAnimationFrame(animate);
  }

  // Mouse move handler
  function handleMouseMove(e) {
    const header = canvas.parentElement;
    if (!header) return;
    const rect = header.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  // Touch move handler for mobile
  function handleTouchMove(e) {
    if (e.touches.length > 0) {
      const header = canvas.parentElement;
      if (!header) return;
      const rect = header.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
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
    window.addEventListener('resize', () => {
      resizeCanvas();
      initNodes();
    });
    
    // Track mouse over entire header, not just canvas
    const header = canvas.parentElement;
    if (header) {
      header.addEventListener('mousemove', handleMouseMove);
      header.addEventListener('touchmove', handleTouchMove, { passive: true });
    }
    
    // Start animation
    animate();
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

