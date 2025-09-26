import * as THREE from 'three';
import { TweenMax as TM } from 'gsap/all';

const perspective = 800;

export default class Scene {
    constructor($scene) {
        this.container = $scene;
        this.W = window.innerWidth;
        this.H = window.innerHeight;

        this.mouse = new THREE.Vector2(0, 0);
        this.activeTile = null;

        this.start();
        this.bindEvent();
    }

    bindEvent() {
        window.addEventListener('resize', () => { this.onResize() });
        window.addEventListener('mousemove', (e) => { this.onMouseMove(e) });
    }

    start() {
        this.mainScene = new THREE.Scene();
        this.initCamera();
        this.initLights();

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            alpha: true,
        });
        this.renderer.setSize(this.W, this.H);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.update();
    }

    initCamera() {
        const fov = (180 * (2 * Math.atan(this.H / 2 / perspective))) / Math.PI;

        this.camera = new THREE.PerspectiveCamera(fov, this.W / this.H, 1, 10000);
        this.camera.position.set(0, 0, perspective);
    }

    initLights() {
        const ambientlight = new THREE.AmbientLight(0xffffff, 2);
        this.mainScene.add(ambientlight);
    }

    /* Handlers
    --------------------------------------------------------- */

    onResize() {
        this.W = window.innerWidth;
        this.H = window.innerHeight;

        this.camera.aspect = this.W / this.H;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.W, this.H);
    }

    onMouseMove(event) {
        TM.to(this.mouse, 0.5, {
            x: event.clientX,
            y: event.clientY,
        });
    }

    /* Actions
    --------------------------------------------------------- */

    update() {
        requestAnimationFrame(this.update.bind(this));
        this.renderer.render(this.mainScene, this.camera);
    }
}

