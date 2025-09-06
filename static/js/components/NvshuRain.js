(function () {
  const NvshuRain = {
    initialized: false,
    containerId: 'nvshu-rain',
    nvshuImages: [
      'combined_10-0-23_vertical_trim.png',
      'combined_16-3-22_vertical_trim.png',
      'combined_21-1-20_vertical_trim.png',
      'combined_23-0-23_vertical_trim.png',
      'combined_14-8-17_vertical_trim.png',
      'combined_19-3-21_vertical_trim.png',
      'combined_22-1-17_vertical_trim.png',
      'combined_17-0-20_vertical_trim.png',
      'combined_20-8-22_vertical_trim.png',
      'combined_12-6-23_vertical_trim.png',
      'combined_18-1-14_vertical_trim.png',
      'combined_23-1-23_vertical_trim.png',
      'combined_16-5-21_vertical_trim.png',
      'combined_13-9-15_vertical_trim.png',
      'combined_14-2-11_vertical_trim.png',
      'combined_16-0-16_vertical_trim.png',
      'combined_15-2-23_vertical_trim.png',
      'combined_11-0-23_vertical_trim.png',
      'combined_13-2-23_vertical_trim.png',
      'combined_13-4-23_vertical_trim.png',
      'combined_14-0-16_vertical_trim.png',
      'combined_16-4-1_vertical_trim.png',
      'combined_17-0-18_vertical_trim.png',
      'combined_19-0-23_vertical_trim.png',
      'combined_20-0-21_vertical_trim.png',
      'combined_20-8-16_vertical_trim.png',
      'combined_21-0-16_vertical_trim.png',
      'combined_21-1-16_vertical_trim.png',
      'combined_21-2-14_vertical_trim.png',
      'combined_21-8-19_vertical_trim.png',
      'combined_22-0-15_vertical_trim.png',
      'combined_22-0-9_vertical_trim.png',
      'combined_22-1-23_vertical_trim.png',
      'combined_22-8-13_vertical_trim.png',
      'combined_23-0-11_vertical_trim.png',
      'combined_23-0-13_vertical_trim.png',
      'combined_23-1-16_vertical_trim.png',
      'combined_23-2-17_vertical_trim.png',
      'combined_23-2-23_vertical_trim.png',
      'combined_23-4-23_vertical_trim.png',
      'combined_23-8-23_vertical_trim.png',
      'combined_4-5-16_vertical_trim.png',
      'combined_5-3-23_vertical_trim.png',
      'combined_7-23-3_vertical_trim.png'
    ],

    ensureContainer() {
      let container = document.getElementById(this.containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'nvshu-rain-container';
        document.body.appendChild(container);
      }
      return container;
    },

    createColumn(x, index) {
      const column = document.createElement('div');
      column.className = 'nvshu-column';

      const duration = (window.gsap && gsap.utils) ? gsap.utils.random(8, 15) : 10;
      const delay = (window.gsap && gsap.utils) ? gsap.utils.random(0, 4) : 0;

      column.style.cssText = `
        left: ${x}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        z-index: 2;
      `;

      const length = Math.floor(Math.random() * 8) + 6; // 6-14
      for (let i = 0; i < length; i++) {
        const imgElement = document.createElement('img');
        imgElement.className = 'char-img';
        imgElement.src = `/static/nvshu_images/${this.nvshuImages[Math.floor(Math.random() * this.nvshuImages.length)]}`;
        imgElement.style.animationDelay = (i * 0.1) + 's';
        imgElement.onerror = function () { this.style.display = 'none'; };
        column.appendChild(imgElement);
      }

      const container = document.getElementById(this.containerId);
      if (container) {
        container.appendChild(column);
        const totalDuration = (duration + delay) * 1000;
        setTimeout(() => {
          if (column.parentNode) {
            column.parentNode.removeChild(column);
            this.createColumn(x, index);
          }
        }, totalDuration);
      }
    },

    createLightParticles() {
      const container = document.getElementById(this.containerId);
      if (!container || !window.gsap) return;
      for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute w-1 h-1 bg-[#FFFDE9] rounded-full opacity-20 pointer-events-none';
        particle.style.left = (gsap.utils ? gsap.utils.random(0, 100) : Math.random() * 100) + '%';
        particle.style.top = (gsap.utils ? gsap.utils.random(0, 100) : Math.random() * 100) + '%';
        particle.style.boxShadow = '0 0 10px rgba(255, 253, 233, 0.5)';
        container.appendChild(particle);

        gsap.to(particle, {
          y: -window.innerHeight,
          duration: gsap.utils ? gsap.utils.random(20, 40) : 30,
          ease: 'none',
          repeat: -1,
          delay: gsap.utils ? gsap.utils.random(0, 10) : 0
        });

        gsap.to(particle, {
          opacity: gsap.utils ? gsap.utils.random(0.1, 0.4) : 0.25,
          duration: gsap.utils ? gsap.utils.random(2, 4) : 3,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut'
        });
      }
    },

    init() {
      if (this.initialized) return;
      this.initialized = true;

      if (!document.getElementById(this.containerId)) {
        this.ensureContainer();
      }

      const container = document.getElementById(this.containerId);
      if (!container) return;

      const screenWidth = window.innerWidth;
      const columnWidth = 60;
      const numColumns = Math.floor(screenWidth / columnWidth);

      container.innerHTML = '';
      for (let i = 0; i < numColumns; i++) {
        const x = i * columnWidth + Math.random() * 30 - 15;
        setTimeout(() => this.createColumn(x, i), i * 150);
      }

      setTimeout(() => this.createLightParticles(), 500);

      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          container.innerHTML = '';
          this.initialized = false;
          this.init();
        }, 300);
      });
    }
  };

  // Auto-init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    // If GSAP is not present, it still works with CSS keyframes only
    NvshuRain.init();
  });

  // Expose to window for manual control if needed
  window.NvshuRain = NvshuRain;
})();


