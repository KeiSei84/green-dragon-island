/**
 * VirtualGamepad — Gameboy-style touch controls for mobile.
 *
 * Layout (landscape):
 *   LEFT side: D-pad (Left, Right, Up)
 *   RIGHT side: A button (Jump/Confirm), B button (Fire)
 *
 * Only visible on touch devices.
 */

export interface GamepadState {
    left: boolean;
    right: boolean;
    up: boolean;
    jump: boolean;       // A button — also triggers "up" for jump
    fire: boolean;       // B button
    jumpJustDown: boolean;
    fireJustDown: boolean;
}

let instance: VirtualGamepad | null = null;

export class VirtualGamepad {
    public state: GamepadState = {
        left: false, right: false, up: false,
        jump: false, fire: false,
        jumpJustDown: false, fireJustDown: false,
    };

    private container: HTMLDivElement | null = null;
    private jumpWasDown = false;
    private fireWasDown = false;
    private visible = false;

    static getInstance(): VirtualGamepad {
        if (!instance) {
            instance = new VirtualGamepad();
        }
        return instance;
    }

    private constructor() {
        if (this.isTouchDevice()) {
            this.create();
        }
    }

    private isTouchDevice(): boolean {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /** Call once per frame in update() to compute justDown flags */
    tick(): void {
        this.state.jumpJustDown = this.state.jump && !this.jumpWasDown;
        this.state.fireJustDown = this.state.fire && !this.fireWasDown;
        this.jumpWasDown = this.state.jump;
        this.fireWasDown = this.state.fire;
    }

    show(): void {
        if (this.container) {
            this.container.style.display = 'flex';
            this.visible = true;
        }
    }

    hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
            this.visible = false;
        }
    }

    private create(): void {
        // Main container — full viewport overlay, pointer-events only on buttons
        this.container = document.createElement('div');
        this.container.id = 'virtual-gamepad';
        this.container.style.cssText = `
            position:fixed; top:0; left:0; width:100vw; height:100vh;
            display:flex; justify-content:space-between; align-items:flex-end;
            padding:12px 16px 18px; box-sizing:border-box;
            pointer-events:none; z-index:9999;
            user-select:none; -webkit-user-select:none;
            touch-action:none;
        `;

        // D-PAD (left side)
        const dpad = document.createElement('div');
        dpad.style.cssText = `
            display:grid; grid-template-columns:56px 56px 56px; grid-template-rows:56px 56px;
            gap:4px; pointer-events:auto;
        `;

        // Row 1: empty | UP | empty
        dpad.appendChild(this.emptyCell());
        dpad.appendChild(this.makeButton('\u25B2', 'up', '#444', '#2d8b46'));
        dpad.appendChild(this.emptyCell());

        // Row 2: LEFT | empty | RIGHT
        dpad.appendChild(this.makeButton('\u25C0', 'left', '#444', '#2d8b46'));
        dpad.appendChild(this.emptyCell());
        dpad.appendChild(this.makeButton('\u25B6', 'right', '#444', '#2d8b46'));

        // ACTION BUTTONS (right side)
        const actions = document.createElement('div');
        actions.style.cssText = `
            display:flex; gap:12px; align-items:flex-end;
            pointer-events:auto;
        `;

        // B button (fire) — positioned slightly higher
        const bWrap = document.createElement('div');
        bWrap.style.cssText = 'margin-bottom:28px;';
        bWrap.appendChild(this.makeRoundButton('B', 'fire', '#993300', '#ff6600'));
        actions.appendChild(bWrap);

        // A button (jump)
        const aWrap = document.createElement('div');
        aWrap.style.cssText = 'margin-bottom:4px;';
        aWrap.appendChild(this.makeRoundButton('A', 'jump', '#1a6b2a', '#2d8b46'));
        actions.appendChild(aWrap);

        this.container.appendChild(dpad);
        this.container.appendChild(actions);
        document.body.appendChild(this.container);
        this.visible = true;
    }

    private emptyCell(): HTMLDivElement {
        const el = document.createElement('div');
        el.style.cssText = 'width:56px;height:56px;';
        return el;
    }

    private makeButton(label: string, key: string, bg: string, activeBg: string): HTMLDivElement {
        const btn = document.createElement('div');
        btn.style.cssText = `
            width:56px; height:56px; background:${bg}; border:2px solid #666;
            border-radius:8px; display:flex; justify-content:center; align-items:center;
            font-size:22px; color:#ddd; font-family:Arial,sans-serif; font-weight:bold;
            opacity:0.75; touch-action:none;
        `;
        btn.textContent = label;
        this.bindTouch(btn, key, bg, activeBg);
        return btn;
    }

    private makeRoundButton(label: string, key: string, bg: string, activeBg: string): HTMLDivElement {
        const btn = document.createElement('div');
        btn.style.cssText = `
            width:64px; height:64px; background:${bg}; border:3px solid #888;
            border-radius:50%; display:flex; justify-content:center; align-items:center;
            font-size:20px; color:#fff; font-family:Arial Black,Arial,sans-serif; font-weight:bold;
            opacity:0.8; touch-action:none;
            box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        `;
        btn.textContent = label;
        this.bindTouch(btn, key, bg, activeBg);
        return btn;
    }

    private bindTouch(el: HTMLElement, key: string, normalBg: string, activeBg: string): void {
        const setKey = (val: boolean) => {
            if (key === 'left') this.state.left = val;
            else if (key === 'right') this.state.right = val;
            else if (key === 'up') { this.state.up = val; this.state.jump = val; }
            else if (key === 'jump') this.state.jump = val;
            else if (key === 'fire') this.state.fire = val;
        };

        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            setKey(true);
            el.style.background = activeBg;
            el.style.opacity = '1';
        }, { passive: false });

        el.addEventListener('touchend', (e) => {
            e.preventDefault();
            setKey(false);
            el.style.background = normalBg;
            el.style.opacity = key === 'jump' || key === 'fire' ? '0.8' : '0.75';
        }, { passive: false });

        el.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            setKey(false);
            el.style.background = normalBg;
            el.style.opacity = key === 'jump' || key === 'fire' ? '0.8' : '0.75';
        }, { passive: false });
    }

    destroy(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        instance = null;
    }
}
