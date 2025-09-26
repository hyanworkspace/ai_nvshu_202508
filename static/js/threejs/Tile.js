import * as THREE from 'three';
import { TweenMax as TM } from 'gsap/all';

export default class Tile {
    constructor($el, scene) {
        this.scene = scene;
        this.$els = {
            el: $el,
        };

        this.sizes = new THREE.Vector2(0, 0);
        this.offset = new THREE.Vector2(0, 0);

        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2(0, 0);

        this.isHovering = false;
        this.hasClicked = false;

        this.loader = new THREE.TextureLoader();

        // Load vertex and fragment shaders
        this.loadShaders();
        this.bindEvent();
    }

    async loadShaders() {
        try {
            const [vertexResponse, fragmentResponse] = await Promise.all([
                fetch('/static/js/threejs/vertexShader.glsl'),
                fetch('/static/js/threejs/gooeyShader.glsl')
            ]);

            this.vertexShader = await vertexResponse.text();
            this.fragmentShader = await fragmentResponse.text();

            this.initTile();
        } catch (error) {
            console.error('Error loading shaders:', error);
        }
    }

    bindEvent() {
        this.$els.el.addEventListener('mouseenter', () => { this.onPointerEnter() });
        this.$els.el.addEventListener('mouseleave', () => { this.onPointerLeave() });

        window.addEventListener('resize', () => { this.onResize() });
    }

    /* Handlers
    --------------------------------------------------------- */

    onPointerEnter() {
        this.isHovering = true;

        if (this.hasClicked) return;

        if (!this.mesh) return;

        TM.to(this.uniforms.u_progressHover, 0.5, {
            value: 1,
            ease: 'power2.easeInOut',
        });
    }

    onPointerLeave() {
        if (this.hasClicked) return;

        TM.to(this.uniforms.u_progressHover, 0.5, {
            value: 0,
            ease: 'power2.easeInOut',
            onComplete: () => {
                this.isHovering = false;
            },
        });
    }

    onResize() {
        this.getBounds();

        if (!this.mesh) return;

        this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);
        this.uniforms.u_res.value.set(window.innerWidth, window.innerHeight);
    }

    /* Actions
    --------------------------------------------------------- */

    initTile() {
        // Create a simple texture for the circle
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Create a radial gradient for the circle
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, 'rgba(255, 251, 233, 0.9)');
        gradient.addColorStop(0.7, 'rgba(255, 251, 233, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 251, 233, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        this.getBounds();

        this.uniforms = {
            u_alpha: { value: 1 },
            u_map: { type: 't', value: texture },
            u_ratio: { value: new THREE.Vector2(1, 1) },
            u_mouse: { value: this.mouse },
            u_progressHover: { value: 0 },
            u_time: { value: this.clock.getElapsedTime() },
            u_res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        };

        this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            transparent: true,
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.x = this.offset.x;
        this.mesh.position.y = this.offset.y;
        this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);

        this.scene.mainScene.add(this.mesh);
    }

    update() {
        if (!this.mesh) return;

        this.getBounds();
        this.mesh.position.x = this.offset.x;
        this.mesh.position.y = this.offset.y;

        if (!this.isHovering) return;
        this.uniforms.u_time.value += this.clock.getDelta();
    }

    /* Values
    --------------------------------------------------------- */

    getBounds() {
        const { width, height, left, top } = this.$els.el.getBoundingClientRect();

        if (!this.sizes.equals(new THREE.Vector2(width, height))) {
            this.sizes.set(width, height);
        }

        if (!this.offset.equals(new THREE.Vector2(left - window.innerWidth / 2 + width / 2, -top + window.innerHeight / 2 - height / 2))) {
            this.offset.set(left - window.innerWidth / 2 + width / 2, -top + window.innerHeight / 2 - height / 2);
        }
    }
}

