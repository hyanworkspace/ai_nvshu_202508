import { TextAnimator } from './text-animator.js';

const init = () => {
  // Apply hover effects to all elements with hover-effect class
  document.querySelectorAll('.hover-effect').forEach(item => {
    const animator = new TextAnimator(item);
    item.addEventListener('mouseenter', () => {
      animator.animate();
    });
    item.addEventListener('mouseleave', () => {
      animator.animateBack();
    });
  });
};

init();
