# Green Dragon Island - Code Audit Report

**Date:** 2026-02-05
**Version:** 1.0.0
**Auditor:** Claude (Automated Audit)

---

## Executive Summary

Green Dragon Island is a Bali-themed 2D platformer built on Phaser 3 + TypeScript + Vite. The codebase is relatively clean for a game project, compiles without TypeScript errors, and builds successfully. However, there are several issues across security, code quality, performance, and architecture that should be addressed.

**Severity Legend:** CRITICAL | HIGH | MEDIUM | LOW | INFO

---

## 1. Security Issues

### 1.1 [HIGH] DOM Event Listener Leaks in EmulatorMode

**File:** `src/game/scenes/EmulatorMode.ts:88-131`

The `createFileInput` and `createDragDrop` methods add DOM event listeners (`click`, `dragover`, `dragleave`, `drop`) to the canvas and create a DOM `<input>` element that is appended to `document.body`, but these are **never cleaned up** when the scene is stopped or restarted. Each time EmulatorMode is entered, a new `<input>` element is appended and new listeners are registered.

- The `<input>` element leaks into the DOM on every visit.
- Canvas event listeners stack up, potentially causing double-firing.

**Recommendation:** Store references to created DOM elements and listeners, and remove them in a `shutdown()` or `destroy()` lifecycle method.

### 1.2 [MEDIUM] Uncontrolled Redirect in Sprite Download Script

**File:** `scripts/generate-sprites.ts:207-213`

The `downloadFile` function follows HTTP redirects (301/302) recursively without a depth limit. A malicious URL could cause infinite redirect loops.

**Recommendation:** Add a maximum redirect counter (e.g., 5).

### 1.3 [MEDIUM] External CDN Dependencies in EmulatorMode

**File:** `src/game/scenes/EmulatorMode.ts:177-183`

The emulator loads SNES core JS/WASM from `cdn.jsdelivr.net` at runtime. This creates a dependency on a third-party CDN at runtime, making the application vulnerable to:
- CDN outages breaking functionality
- Potential supply chain attacks if the CDN repository is compromised

**Recommendation:** Consider bundling the emulator cores locally or implementing subresource integrity (SRI) checks.

### 1.4 [LOW] Non-null Assertions on Keyboard Input

**Files:** Multiple scenes (`Level1.ts:101-102`, `BossFight.ts:146-147`, `MainMenu.ts:123,127`, etc.)

Widespread use of `this.input.keyboard!` with non-null assertions. While Phaser typically initializes keyboard input, this could cause runtime crashes if the game is run in a headless environment or if input is disabled.

**Recommendation:** Add a null check or assert once and store the reference.

---

## 2. Bugs & Correctness Issues

### 2.1 [HIGH] `fireballHitBoss` Parameter Order Mismatch

**File:** `src/game/scenes/BossFight.ts:244`

```typescript
private fireballHitBoss(bossObj: any, fireballObj: any): void {
```

The overlap callback in Phaser receives parameters in the order `(object1, object2)` matching the order passed to `this.physics.add.overlap(this.fireballs, this.boss, ...)` at line 138. This means the first parameter should be `fireball` and the second `boss`, but the method names them reversed (`bossObj` first, `fireballObj` second).

The actual behavior depends on Phaser's internal ordering. If Phaser passes them as `(fireballs_member, boss)`, then `bossObj` actually receives the fireball and `fireballObj` receives the boss. The code casts them and calls `.destroy()` on what it thinks is the fireball - if the order is wrong, it would destroy the boss sprite instead of the fireball.

**Recommendation:** Verify the Phaser overlap callback parameter order and fix the naming/casting. Use typed callbacks instead of `any`.

### 2.2 [HIGH] `touchBoss` Fake Object Workaround

**File:** `src/game/scenes/BossFight.ts:384`

```typescript
this.projectileHitPlayer(_player, { destroy: () => {} });
```

When the player touches the boss, the code calls `projectileHitPlayer` with a fake object that has an empty `destroy()` method. This is a code smell - the method assumes it receives a real Arcade Sprite but gets a plain object. While it works because `destroy()` is the only method called on it before the early return, it's fragile and will break if `projectileHitPlayer` is ever modified to access other sprite properties.

**Recommendation:** Extract the damage logic into a separate `damagePlayer()` method and call it from both places.

### 2.3 [MEDIUM] State Not Reset Between Scene Restarts

**File:** `src/game/scenes/BossFight.ts:44`, `src/game/scenes/Level1.ts:31-35`

The `hearts` array in both `Level1` and `BossFight` is initialized as a class property (`hearts: GameObjects.Image[] = []`) but is never cleared in `create()`. If the scene is restarted, the old image references remain in the array from the previous run (though they are destroyed by Phaser). The `createHUD()` pushes new hearts, so the array grows on each restart.

This doesn't crash because Phaser's scene restart creates a fresh instance, but it's a potential issue if scenes are reused via `scene.restart()` instead of `scene.start()`.

**Recommendation:** Clear `this.hearts = []` at the beginning of `create()`.

### 2.4 [MEDIUM] Missing `score` Registry Sync in GameOver/Victory

**Files:** `src/game/scenes/Level1.ts:415-416`, `src/game/scenes/BossFight.ts:313-315`

When the player dies in Level1, the score is **not** saved to the registry before transitioning to GameOver (only health is set to 0). The GameOver scene reads score from registry (`this.registry.get('score')`), but if the player collected coins since the last registry update, those coins won't be reflected.

In BossFight, the score IS properly saved before GameOver transition. Inconsistent behavior.

**Recommendation:** Add `this.registry.set('score', this.score)` before the `scene.start('GameOver')` call in Level1.

### 2.5 [MEDIUM] Coin Arc Division by Zero

**File:** `src/game/scenes/Level1.ts:274`

```typescript
y: baseY - Math.sin((i / (count - 1)) * Math.PI) * 40
```

If `count === 1`, this results in division by zero (`0 / 0 = NaN`), producing `NaN` for the y coordinate. While the current code never calls it with `count=1`, it's an unprotected edge case.

**Recommendation:** Add a guard: `count <= 1 ? 0 : (i / (count - 1))`.

### 2.6 [LOW] `GRAVITY` Constant Declared but Unused

**File:** `src/game/scenes/Level1.ts:5`

```typescript
const GRAVITY = 900;
```

Declared but never referenced. The gravity is set in the Phaser game config (`src/game/main.ts:20`).

### 2.7 [LOW] Unused Variable `snesBtn`

**File:** `src/game/scenes/MainMenu.ts:114`

```typescript
const snesBtn = this.add.text(...)
```

Variable is assigned but never used.

### 2.8 [LOW] Unused Variable `menu` in GameOver

**File:** `src/game/scenes/GameOver.ts:54`

```typescript
const menu = this.add.text(...)
```

Variable is assigned but never used.

### 2.9 [LOW] Unused Variable `tile2` in Level1

**File:** `src/game/scenes/Level1.ts:141`

```typescript
const tile2 = this.add.image(x + 16, LEVEL_HEIGHT - 48, 'ground');
```

Variable assigned, creates a visual element but is never added to physics group, which is intentional. However, the variable itself is unused.

---

## 3. Performance Issues

### 3.1 [MEDIUM] Large Number of Tweens for Water Pits

**File:** `src/game/scenes/Level1.ts:220-233`

Each water tile gets its own individual tween. For a pit from x=800 to x=900, that's ~3 tweens (100/32). Across all 4 pits, that's ~15 tweens. Not critical, but unnecessarily individual.

**Recommendation:** Consider using a shared sine wave calculation in `update()` or a single tween group.

### 3.2 [MEDIUM] Particle Emitters Created and Destroyed Frequently

**Files:** `src/game/scenes/Level1.ts:384-394`, `459-469`, `479-489`, `518-528`, `570-584`

Every coin collect, enemy kill, fireball shot, and flutter creates a new particle emitter, explodes it, then destroys it via `delayedCall`. This pattern creates significant garbage collection pressure during intense gameplay.

**Recommendation:** Pre-create reusable particle emitters and reposition/re-emit them as needed.

### 3.3 [MEDIUM] Phaser Chunk Size Warning (1.48 MB)

The Phaser library chunk is 1.48 MB (339 KB gzipped). This is inherent to Phaser 3 and expected.

**Recommendation:** Consider using `phaser/phaser-lite` or dynamic import for non-essential Phaser modules if bundle size is a concern. Also consider adding `nostalgist` to manual chunks since it's only needed for EmulatorMode.

### 3.4 [LOW] Enemy AI Runs for All Enemies Every Frame

**File:** `src/game/scenes/Level1.ts:605-635`

The `enemies.children.each()` loop iterates all 16 enemies every frame, even those far off-screen. For 16 enemies this is negligible, but the pattern doesn't scale.

**Recommendation:** For the current enemy count this is fine. If scaling up, consider distance-based culling.

---

## 4. Architecture & Code Quality

### 4.1 [MEDIUM] Duplicated Player Controller Logic

**Files:** `src/game/scenes/Level1.ts:531-598` vs `src/game/scenes/BossFight.ts:553-599`

The player movement code (horizontal movement, jump, flutter, fire, rider follow) is nearly identical in Level1 and BossFight with minor constant differences (hardcoded `220`, `-480`, `-320`, `500` in BossFight vs using constants in Level1). This violates DRY.

**Recommendation:** Extract a shared `PlayerController` class or mixin.

### 4.2 [MEDIUM] Heavy Use of `any` Type

**Files:** Multiple locations

- Collision callbacks use `any` parameters (`collectCoin(_player: any, coinObj: any)`)
- `EmulatorMode.nostalgist` is typed as `any`
- `Nostalgist.launch()` config is cast as `any`

**Recommendation:** Use proper Phaser types (`Physics.Arcade.Sprite`, `GameObjects.GameObject`) for collision callbacks. Create an interface for the Nostalgist instance.

### 4.3 [MEDIUM] Magic Numbers Throughout

**File:** `src/game/scenes/Level1.ts` and `BossFight.ts`

Many magic numbers are used inline:
- `y > LEVEL_HEIGHT - 10` (pit death check)
- `x > LEVEL_WIDTH - 200` (level end trigger)
- `350` (stomp bounce velocity)
- `60` (monkey patrol speed)
- `30` (leyak pursuit speed)
- `400` (leyak detection range)
- Hardcoded values `220`, `480`, `320` in BossFight instead of using constants

Level1 defines constants at the top (good), but BossFight hardcodes equivalent values.

**Recommendation:** Define all gameplay constants at the top of each file or in a shared config module.

### 4.4 [LOW] No Audio System

The game has no sound effects or music. For a platformer, this is a significant UX gap.

### 4.5 [LOW] No Mobile/Touch Support

Controls are keyboard-only. No touch/gamepad input handling.

### 4.6 [INFO] TypeScript Strictness Relaxations

**File:** `tsconfig.json:14-16`

```json
"strictPropertyInitialization": false,
"noUnusedLocals": false,
"noUnusedParameters": false
```

These are intentionally relaxed for game development convenience. Acceptable for a game project but worth noting.

---

## 5. Dependencies

### 5.1 [HIGH] Nostalgist Requires Node >= 24.7.0

**File:** `package.json` dependency `nostalgist@^0.20.2`

```
npm warn EBADENGINE Unsupported engine {
  package: 'nostalgist@0.20.2',
  required: { node: '>=24.7.0' },
  current: { node: 'v22.22.0', npm: '10.9.4' }
}
```

The `nostalgist` library requires Node.js >= 24.7.0, but the current environment runs Node 22. This means the library may not work correctly in SSR/testing scenarios. For browser-only usage this is less critical since Nostalgist runs in the browser, but it prevents proper testing and may cause issues with `npm ci --engine-strict`.

**Recommendation:** Either upgrade Node.js or pin to a compatible version of nostalgist, or add `"engines"` field to package.json.

### 5.2 [LOW] No Lock on Major Versions

**File:** `package.json`

All dependencies use caret ranges (`^`), which allows minor and patch updates. For a game project, this is acceptable, but `phaser` major updates could break the game.

### 5.3 [INFO] No Testing Framework

No test runner (Jest, Vitest, etc.) is configured. No tests exist.

### 5.4 [INFO] No Linting Configuration

No ESLint, Prettier, or other code formatting tools are configured.

---

## 6. Build & Configuration

### 6.1 [LOW] Missing `type` Field in package.json

**File:** `package.json`

No `"type": "module"` field, but the project uses ES modules (Vite + TypeScript ESNext modules). Vite handles this, but explicit declaration is better practice.

### 6.2 [INFO] Build Output

- Build succeeds without errors
- TypeScript compilation (`tsc --noEmit`) passes without errors
- Bundle: 93.67 KB app code + 1.48 MB Phaser (339 KB gzipped)
- Nostalgist is tree-shaken into the app bundle (not separately chunked)

---

## 7. Asset Pipeline

### 7.1 [MEDIUM] DALL-E Generated Assets Not Validated

**File:** `scripts/generate-sprites.ts`

The sprite generation script downloads DALL-E outputs directly without validating:
- Image dimensions (DALL-E doesn't guarantee exact pixel layouts)
- File integrity (no checksum verification)
- Whether the generated image actually contains proper sprite sheet layouts

DALL-E 3 cannot reliably generate pixel-perfect sprite sheets with exact frame boundaries. The game works around this by using procedural fallbacks, but the DALL-E assets are loaded as single images rather than sprite sheets.

### 7.2 [LOW] Hybrid Asset Strategy Creates Confusion

The game loads DALL-E images (e.g., `dragon_sheet`, `player_sheet`) in Boot.ts but never uses them as sprite sheets - they're only used as static display images in MainMenu. The actual gameplay uses procedural sprites from `AssetGenerator.ts`. This dual system is functional but confusing.

---

## 8. Summary of Findings

| Severity | Count |
|----------|-------|
| CRITICAL | 0     |
| HIGH     | 3     |
| MEDIUM   | 11    |
| LOW      | 9     |
| INFO     | 4     |
| **Total**| **27**|

### Top Priority Fixes

1. **Fix `fireballHitBoss` parameter order** - Potential gameplay-breaking bug
2. **Clean up DOM listeners in EmulatorMode** - Memory/listener leak
3. **Extract `damagePlayer()` method** - Remove fake object hack in `touchBoss`
4. **Save score to registry before GameOver in Level1** - Data loss bug
5. **Address nostalgist Node.js version requirement** - Build/CI compatibility

---

## 9. Positive Observations

- Clean TypeScript with strict mode enabled
- Good separation of scenes following Phaser best practices
- Procedural asset fallback system is clever and ensures the game works without external assets
- Phaser chunk splitting in Vite config is correct
- Git ignore properly excludes sensitive files (.env, node_modules, dist)
- No security vulnerabilities in npm dependencies (`found 0 vulnerabilities`)
- Code is readable and well-organized for a game project
