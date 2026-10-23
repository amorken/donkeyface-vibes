# Donkey Face — Live visual desk

A browser-based concert visuals app for Cognite’s house band at DevCon 2026. The stage window shows the visuals; the control desk runs on your own screen. Ten scenes follow the setlist, with tap tempo, gradual transitions, a sax spotlight, and a moving Cognite mark.

## Run the portable app

1. Download [Donkey-Face.html](https://github.com/amorken/donkeyface-vibes/raw/refs/heads/main/release/Donkey-Face.html) (use **Download raw file** on GitHub if you see source code).
2. Copy that single file to the concert machine and open it in desktop **Chrome or Edge**. No install, server, account, microphone, or internet connection is required.
3. Click **Open stage window** and allow the pop-up if prompted. Move the new window to the audience screen, then press **F** or double-click to enter fullscreen. Browser fullscreen commands such as F11 also work.
4. Keep the control desk on your own screen. Use **Compact desk** for a smaller supporting window. Select songs with the setlist or arrow keys.
5. Tap **Space** along with the band. The app averages up to eight taps, ignores accidental fast taps, and keeps the tempo running after you stop. A pause of over 2.5 seconds starts a new tap sequence. Each song starts with a suggested tempo; tap along to set the actual live tempo.

Keep the desk open while the stage window is running. The stage contains no controls once the fullscreen hint fades. It will keep animating if the control desk temporarily loses focus. Blackout is immediate and leaves the internal beat running.

The release embeds the visual code, fonts, DevCon artwork, and Cognite SVG. All visuals are generated locally with Canvas 2D. Brightness and intensity are adjustable; there is no rapid full-screen strobe. “Pause motion” freezes the scene while the metronome continues.

## Artwork and saved shows

**Show settings** (top-right sliders icon) lets you replace the default DevCon artwork with a PNG, JPEG, or WebP up to 2 MB. **Save show file** creates another self-contained HTML file with your custom artwork, selected song, and controls embedded. That file can be copied to another machine. Custom artwork otherwise remains in browser storage on the machine where you uploaded it.

The default DevCon image is a cleaned, adapted version of the supplied chat reference, not the original image file. The supplied `cognite.svg.txt` is included as the actual SVG, unchanged, and animates in the lower-left corner. The Cognite wave, central DevCon artwork, and optional song titles can be toggled separately.

Chrome and Edge allow a normal local HTML file to open its stage window and communicate through `window.opener`. Managed corporate browsers can restrict local files or pop-ups; check the concert machine before showtime. Browser settings should allow fullscreen and keep the machine awake during the show.

## Keyboard controls

| Key | Action |
| --- | --- |
| Space | Tap the beat |
| Left / Right | Previous / next song |
| 1–9, 0 | Jump to songs 1–10 |
| B | Blackout / restore stage |
| S | Sax spotlight |
| P | Pause / resume motion |
| F | Fullscreen (stage window) |
| ? | Keyboard reference (control desk) |

Shortcuts do not intercept typing in inputs or controls in a dialog. Buttons can be activated with Enter; Space is reserved for tempo outside dialogs.

## Develop

Node.js 22.12+ (tested with Node 24) and npm are required for development only.

```sh
npm ci
npm run dev
```

```sh
npm test                 # Tempo averaging and persisted-state validation
npm run build            # Standard static build in dist/
npm run package          # Rebuild release/Donkey-Face.html; commit it with source changes
npm run test:browser     # Chromium functional tests against exact release HTML bytes
```

Browser tests use `/usr/bin/chromium` by default. Set `CHROMIUM_PATH` to your Chromium executable elsewhere. The tests exercise the release without an HTTP server, fulfilling its document from memory and rejecting other network requests. They cover two-window synchronization with BroadcastChannel and storage events disabled, all ten scenes, tap tempo, motion pause, blackout, custom artwork, export to a clean browser context, compact layout, and mobile overflow.

The cloud’s managed Chromium policy blocks `file://` navigation. The direct local-file check is explicitly skipped on that policy error; the remaining checks use the exact self-contained release HTML through an in-memory route. Direct opening on the concert machine remains a pre-show check.

## Setlist

| Song | Scene |
| --- | --- |
| Seven Nation Army — The White Stripes | Red signal / geometric tunnel |
| Uprising — Muse | Resistance / marching columns |
| Take On Me — a-ha | Neon daydream / horizon grid |
| Sweet Dreams — Eurythmics / Manson style | Liquid gold / flowing ribbons |
| Viva La Vida — Coldplay | Golden hour / celestial orbits |
| Hun er forelska i lærer’n — The Kids | School’s out / confetti |
| Sex on Fire — Kings of Leon | Slow burn / rising embers |
| Teenage Dirtbag — Wheatus | After-school static / constellations |
| Run Away — Sunstroke Project & Olia Tira | Sax machine / laser fans |
| Shut Up and Dance — WALK THE MOON | One last dance / color starburst |

The locally bundled Space Grotesk font uses the SIL Open Font License, included in `public/fonts/SpaceGrotesk-LICENSE.txt` and in the portable HTML.
