const container = document.querySelector('.background-animation');

function createDot() {
  const dot = document.createElement('div');
  dot.classList.add('dot');

  const size = Math.random() * 12 + 8; // 8px to 20px
  dot.style.width = `${size}px`;
  dot.style.height = `${size}px`;
  dot.style.top = `${Math.random() * 100}vh`;
  dot.style.left = `-${size}px`;
  dot.style.animationDuration = `${Math.random() * 8 + 4}s`;

  container.appendChild(dot);

  setTimeout(() => {
    dot.remove();
  }, 12000);
}

// Generate dots continuously
setInterval(createDot, 300);

