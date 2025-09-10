import Scene from './Scene.js';
import Tile from './Tile.js';

const APP = window.APP || {};

class ThreeJSApp {
    constructor() {
        this.init();
    }

    init() {
        const canvas = document.getElementById('threejs-canvas');
        if (!canvas) {
            console.error('Three.js canvas not found');
            return;
        }

        this.scene = new Scene(canvas);

        // Initialize tiles for upload circles
        this.initTiles();

        // Start animation loop
        this.animate();
    }

    initTiles() {
        const uploadCircle = document.getElementById('uploadOption');
        const recordCircle = document.getElementById('recordOption');

        if (uploadCircle) {
            this.uploadTile = new Tile(uploadCircle, this.scene);
        }

        if (recordCircle) {
            this.recordTile = new Tile(recordCircle, this.scene);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.uploadTile) {
            this.uploadTile.update();
        }

        if (this.recordTile) {
            this.recordTile.update();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.APP = APP;
    APP.ThreeJS = new ThreeJSApp();
});

