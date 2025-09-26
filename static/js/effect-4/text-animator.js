// Import the TextSplitter class for handling text splitting.
import { TextSplitter } from '../textSplitter.js';

const lettersAndSymbols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '+', '=', ';', ':', '<', '>', ','];

// Defines a class to create hover effects on text.
export class TextAnimator {
  constructor(textElement) {
    // Check if the provided element is valid.
    if (!textElement || !(textElement instanceof HTMLElement)) {
      throw new Error('Invalid text element provided.');
    }
    this.textElement = textElement;
    this.originalChars = []; // Store the original characters
    this.isAnimating = false; // Flag to prevent multiple simultaneous animations
    this.hoverTimeout = null; // Timeout for debouncing
    this.splitText();
  }

  splitText() {
    // Split text for animation and store the reference.
    this.splitter = new TextSplitter(this.textElement, {
      splitTypeTypes: 'words, chars'
    });
    // Save the initial state of each character
    this.originalChars = this.splitter.getChars().map(char => char.innerHTML);
  }

  animate() {
    // Prevent multiple simultaneous animations
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;
    // Reset any ongoing animations
    this.reset();

    // Query all individual characters in the line for animation.
    const chars = this.splitter.getChars();
    chars.forEach((char, position) => {
      let initialHTML = char.innerHTML;
      gsap.fromTo(char, {
        opacity: 0
      }, {
        duration: 0.03,
        onComplete: () => gsap.set(char, { innerHTML: initialHTML, delay: 0.1 }),
        repeat: 2,
        repeatRefresh: true,
        repeatDelay: 0.05, // delay between repeats
        delay: (position + 1) * 0.06, // delay between chars
        innerHTML: () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)],
        opacity: 1
      });
    });

    gsap.fromTo(this.textElement, {
      '--anim': 0
    }, {
      duration: 1,
      ease: 'expo',
      '--anim': 1,
      onComplete: () => {
        this.isAnimating = false; // Reset animation flag when complete
      }
    });
  }

  animateBack() {
    // Clear any pending hover timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    gsap.killTweensOf(this.textElement); // Ensure no ongoing animations
    gsap.to(this.textElement, {
      duration: .6,
      ease: 'power4',
      '--anim': 0,
      onComplete: () => {
        this.isAnimating = false; // Reset animation flag
      }
    });
  }

  // Debounced hover handler to prevent rapid firing at edges
  handleHover() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    this.hoverTimeout = setTimeout(() => {
      this.animate();
      this.hoverTimeout = null;
    }, 50); // 50ms debounce delay
  }

  // Debounced hover leave handler
  handleHoverLeave() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    this.hoverTimeout = setTimeout(() => {
      this.animateBack();
      this.hoverTimeout = null;
    }, 50); // 50ms debounce delay
  }

  reset() {
    // Reset the text to its original state
    const chars = this.splitter.getChars();
    chars.forEach((char, index) => {
      gsap.killTweensOf(char); // Ensure no ongoing animations
      char.innerHTML = this.originalChars[index];
    });
    gsap.killTweensOf(this.textElement);
    gsap.set(this.textElement, {'--anim': 0});
  }
}

