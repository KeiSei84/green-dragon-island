/**
 * Sprite generation script using OpenAI DALL-E 3 API.
 * Generates all game assets as pixel-art PNG sprites.
 *
 * Usage: npx tsx scripts/generate-sprites.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const API_KEY = process.env.OPENAI_API_KEY || '';
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets');

interface SpriteRequest {
    name: string;
    dir: string;
    prompt: string;
    size: '1024x1024' | '1792x1024' | '1024x1792';
}

const SPRITES: SpriteRequest[] = [
    // === CHARACTERS ===
    {
        name: 'dragon',
        dir: 'sprites',
        size: '1792x1024',
        prompt: `Pixel art sprite sheet of a Balinese mythological dragon "Naga Basuki" for a 2D platformer game.
The dragon is GREEN with a GOLDEN CROWN on its head, a glowing RED GEM (Nagamani) on the forehead, small wings, a serpentine body with 4 legs and golden claws.
Show 4 frames side by side in a horizontal strip: walking animation frames (legs alternating, wings flapping).
Style: 16-bit SNES pixel art, clean outlines, vibrant colors, side view facing right.
Background: solid magenta (#FF00FF) for transparency keying.
The dragon should be cute but majestic, similar to Yoshi from Super Mario but as a Balinese dragon-serpent.`
    },
    {
        name: 'player',
        dir: 'sprites',
        size: '1024x1024',
        prompt: `Pixel art sprite sheet of a tourist/investor character for a 2D platformer game set in Bali.
Small character wearing: blue polo shirt, beige shorts, brown sandals, dark sunglasses, carrying a small brown briefcase.
Show 4 frames in a 2x2 grid: walking left, walking right, jumping, idle standing.
Style: 16-bit SNES pixel art, clean outlines, cute chibi proportions, side view.
Background: solid magenta (#FF00FF) for transparency keying.
The character should be about 32x48 pixels tall in each frame.`
    },
    {
        name: 'boss_frey',
        dir: 'sprites',
        size: '1792x1024',
        prompt: `Pixel art sprite sheet of a game BOSS villain for a 2D platformer: a shady European businessman-scammer in Bali.
He wears an ORANGE PRISON UNIFORM (jumpsuit), has short dark hair, angry eyebrows, a smirk.
In some frames he carries GREEN MONEY BAGS with dollar signs.
Show 4 frames side by side: 1) walking with money bags, 2) throwing a paper contract, 3) running away scared, 4) defeated falling down.
Style: 16-bit SNES pixel art, clean outlines, villainous expression, side view.
Background: solid magenta (#FF00FF) for transparency keying.`
    },
    {
        name: 'monkey',
        dir: 'sprites',
        size: '1024x1024',
        prompt: `Pixel art sprite sheet of a mischievous Balinese long-tailed macaque monkey for a 2D platformer game.
Brown fur, lighter belly, long curled tail, playful/evil expression.
Show 4 frames in a 2x2 grid: walking left, walking right, jumping, throwing something.
Style: 16-bit SNES pixel art, clean outlines, cute but mischievous, side view.
Background: solid magenta (#FF00FF) for transparency keying.
Small enemy size, about 32x32 pixels per frame.`
    },
    {
        name: 'leyak',
        dir: 'sprites',
        size: '1024x1024',
        prompt: `Pixel art sprite sheet of a LEYAK - a Balinese mythological flying demon for a 2D platformer game.
A floating severed head with wild black hair, green skin, GLOWING RED EYES, white fangs, and red entrails/intestines trailing below.
Show 4 frames in a 2x2 grid: floating left, floating right, attacking, hurt.
Style: 16-bit SNES pixel art, spooky but game-appropriate, not too gory, floating animation.
Background: solid magenta (#FF00FF) for transparency keying.`
    },

    // === BACKGROUNDS ===
    {
        name: 'bg_rice_terraces',
        dir: 'backgrounds',
        size: '1792x1024',
        prompt: `Pixel art background for a 2D platformer game level: Tegallalang Rice Terraces in Ubud, Bali.
Layered parallax-ready composition:
- Sky with soft clouds and a distant volcano (Mount Agung) silhouette
- Lush GREEN rice terrace steps going down the hillside
- Palm trees, tropical vegetation
- Small Balinese temple with split gate (Candi Bentar) visible
- Warm golden sunlight, tropical atmosphere
Style: 16-bit SNES pixel art like Yoshi's Island backgrounds, vibrant greens and blues, hand-painted feel.
Horizontal panoramic format.`
    },
    {
        name: 'bg_boss_arena',
        dir: 'backgrounds',
        size: '1792x1024',
        prompt: `Pixel art background for a 2D platformer BOSS FIGHT arena: an illegal resort compound in Bali at night.
- Dark moody night sky with full moon
- Modern concrete buildings (illegally built on rice fields)
- Police tape / "CLOSED" signs
- Remnants of rice paddies being destroyed by construction
- Ominous atmosphere, yellow police lights
- Balinese temple partially demolished in background
Style: 16-bit SNES pixel art, dark color palette, moody lighting, atmospheric.`
    },

    // === TILES ===
    {
        name: 'tileset',
        dir: 'tiles',
        size: '1024x1024',
        prompt: `Pixel art tileset for a 2D Bali-themed platformer game. 32x32 pixel tiles arranged in a grid:
Row 1: Grass/earth platform tiles (green grass on brown earth, left edge, center, right edge)
Row 2: Stone temple platform tiles (grey carved Balinese stone, ornamental patterns)
Row 3: Bamboo bridge tiles (light brown bamboo planks and rope)
Row 4: Water tiles (blue rice paddy water with ripples)
Row 5: Decorative tiles (frangipani flowers, small Balinese ornaments, torches)
Style: 16-bit SNES pixel art, consistent palette, clean tile edges that connect seamlessly.
Background: solid magenta (#FF00FF) for transparency keying.`
    },

    // === ITEMS ===
    {
        name: 'items',
        dir: 'sprites',
        size: '1024x1024',
        prompt: `Pixel art item sprites for a 2D Bali-themed platformer game, arranged on a grid:
Row 1: NAGAMANI GEM - a glowing golden/amber magical gem (4 rotation frames showing it spinning)
Row 2: RED HEART (health pickup, 3 frames: full, half, empty)
Row 3: FIREBALL - orange/yellow dragon fire breath projectile (4 frames of flame animation)
Row 4: FAKE CONTRACT - white paper document with red "FRAUD" stamp (projectile thrown by boss)
Row 5: Balinese CANDI BENTAR split gate (checkpoint marker, 64 pixels tall)
Style: 16-bit SNES pixel art, vibrant colors, clean outlines.
Background: solid magenta (#FF00FF) for transparency keying.`
    },
];

async function generateSprite(sprite: SpriteRequest): Promise<void> {
    const outDir = path.join(ASSETS_DIR, sprite.dir);
    const outPath = path.join(outDir, `${sprite.name}.png`);

    if (fs.existsSync(outPath)) {
        console.log(`[SKIP] ${sprite.name} — already exists`);
        return;
    }

    console.log(`[GEN]  ${sprite.name} — requesting DALL-E 3...`);

    const body = JSON.stringify({
        model: 'dall-e-3',
        prompt: sprite.prompt,
        n: 1,
        size: sprite.size,
        quality: 'hd',
        response_format: 'url'
    });

    const response = await new Promise<any>((resolve, reject) => {
        const req = https.request({
            hostname: 'api.openai.com',
            path: '/v1/images/generations',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk: string) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });

    if (response.error) {
        console.error(`[ERR]  ${sprite.name}: ${response.error.message}`);
        return;
    }

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
        console.error(`[ERR]  ${sprite.name}: No URL in response`);
        console.error(JSON.stringify(response, null, 2));
        return;
    }

    // Download the image
    console.log(`[DL]   ${sprite.name} — downloading...`);
    await downloadFile(imageUrl, outPath);
    console.log(`[OK]   ${sprite.name} → ${outPath}`);
}

function downloadFile(url: string, dest: string, maxRedirects = 5): Promise<void> {
    return new Promise((resolve, reject) => {
        if (maxRedirects <= 0) {
            reject(new Error('Too many redirects'));
            return;
        }
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlink(dest, () => {});
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    downloadFile(redirectUrl, dest, maxRedirects - 1).then(resolve).catch(reject);
                    return;
                }
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function main() {
    if (!API_KEY) {
        console.error('ERROR: OPENAI_API_KEY not set');
        process.exit(1);
    }

    console.log(`\n🐉 Green Dragon Island — Sprite Generator`);
    console.log(`   Generating ${SPRITES.length} assets via DALL-E 3...\n`);

    // Generate sequentially to avoid rate limits
    for (const sprite of SPRITES) {
        try {
            await generateSprite(sprite);
        } catch (err: any) {
            console.error(`[ERR]  ${sprite.name}: ${err.message}`);
        }
        // Small delay between requests
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n✅ Done! Check public/assets/ for generated sprites.\n`);
}

main();
