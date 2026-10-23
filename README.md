# Donkey Face — Live visual desk

A browser-based concert visuals app for Cognite’s house band at DevCon 2026. The stage window shows the visuals; the control desk runs on your own screen. Ten song scenes, a mellow **Pause time** scene, and a **What’s next** agenda scene follow the show, with tap tempo, gradual transitions, a sax spotlight, and a moving Cognite symbol above fixed lettering.

## Run the portable app

1. Download [Donkey-Face.html](https://github.com/amorken/donkeyface-vibes/raw/refs/heads/main/release/Donkey-Face.html) (use **Download raw file** on GitHub if you see source code).
2. Copy that single file to the concert machine and open it in desktop **Chrome or Edge**. No install, server, account, microphone, or internet connection is required.
3. Click **Open stage window** and allow the pop-up if prompted. Move the new window to the audience screen, then press **F** or double-click to enter fullscreen. Browser fullscreen commands such as F11 also work.
4. Keep the control desk on your own screen. Use **Compact desk** for a smaller supporting window. Select songs with the setlist or arrow keys.
5. Tap **Space** along with the band. The app averages up to eight taps, ignores accidental fast taps, and keeps the tempo running after you stop. A pause of over 2.5 seconds starts a new tap sequence. Each song starts with a suggested tempo; tap along to set the actual live tempo.

Keep the desk open while the stage window is running. The stage contains no controls once the fullscreen hint fades. It will keep animating if the control desk temporarily loses focus. Blackout is immediate and leaves the internal beat running.

The release embeds the visual code, fonts, DevCon artwork, and Cognite SVG. All visuals are generated locally with Canvas 2D. Brightness, beat intensity, and motion aggressiveness are adjustable; there is no rapid full-screen strobe. “Pause motion” freezes the scene while the metronome continues.

**Motion aggressiveness** controls the amplitude and speed of the scene, beat pulses, and Cognite symbol. At 0% the scene stays still; 50% is the standard look; higher values add wider sweeps, stronger waves, and more active movement. Adjustments preserve the animation’s current time, and the slider is available in compact mode too. Beat intensity independently controls how strongly the visuals respond to each beat.

Select **Pause time** at the end of the setlist, or press **A**, for quiet moments between sets or conversations. It uses restrained, slowly drifting ribbons with DevCon and Cognite branding, suppresses Donkey Face captions and song titles, and ignores tap tempo and sax spotlight. Its motion remains mellow even with a high motion setting. The Cognite symbol gently waves, while “Cognite” and “AI for Industry” remain stationary in every scene. Use the song buttons, arrows, or number keys to return to the concert.

## What’s next on the agenda

Select **What’s next** in the setlist, or press **W**, for the ambient background with the upcoming DevCon program on top. It includes the 17 time blocks from the supplied `DevCon26_Agenda_onepager.pdf`: **Monday 26 October 2026, MESH Youngstorget**. Parallel tracks appear together with their talk titles, speakers, and rooms; blank track slots in the PDF are omitted. The Cognite symbol keeps its subtle motion and the band captions remain hidden.

Automatic selection follows **Europe/Oslo** time, regardless of the concert machine’s time zone. By default, a scheduled item remains visible until **five minutes after its start**, then the screen advances to the next time block. A just-started item is marked “Starting now.” The **Keep after start** control allows a grace period from 0 to 15 minutes.

In the control desk’s **On the agenda** panel, choose a specific item under **Program shown** to hold it manually if the event runs early or late. It stays selected until you choose **Automatic · follow the clock**, including across reloads or switching scenes. The selection and grace period sync to the stage and are included in exported show files. These controls are also available in compact mode.

Before the event day, Automatic shows the opening coffee slot. After the last item starts plus its grace period, it keeps the closing keynote marked “Final session” for the remainder of the event day; the PDF provides no closing end time. On later dates it shows a thank-you screen. Manual selection works on any date for rehearsals or schedule changes. The display uses the machine’s clock and needs no internet connection.

## Artwork and saved shows

**Show settings** (top-right sliders icon) lets you replace the default DevCon artwork with a PNG, JPEG, or WebP up to 2 MB. **Save show file** creates another self-contained HTML file with your custom artwork, selected song, and controls embedded. That file can be copied to another machine. Custom artwork otherwise remains in browser storage on the machine where you uploaded it.

The default DevCon image is a cleaned, adapted version of the supplied chat reference, not the original image file. The supplied `cognite.svg.txt` is included as the actual SVG, unchanged, and animates in the lower-left corner. The Cognite wave, central DevCon artwork, and optional song titles can be toggled separately.

Chrome and Edge allow a normal local HTML file to open its stage window and communicate through `window.opener`. Managed corporate browsers can restrict local files or pop-ups; check the concert machine before showtime. Browser settings should allow fullscreen and keep the machine awake during the show.

## Serve the portable app over HTTP

If Node.js is installed, the included server provides an alternative to opening the HTML directly. From the repository directory, run:

```sh
npm run serve
```

Open `http://127.0.0.1:4173` in Chrome or Edge, then use **Open stage window** as usual. The server serves the actual portable HTML, including the stage window’s query string. It uses only built-in Node modules, so `npm install` is not required to serve the committed release.

You can also serve an exported show file or choose another port:

```sh
node scripts/serve.mjs --file /path/to/Donkey-Face-Show.html --port 8080
```

The server listens on the local machine by default and exposes only the chosen HTML file. Press Ctrl+C to stop it. You can copy `scripts/serve.mjs` alongside the HTML and use `--file` to point at it; development dependencies are not needed.

## Keyboard controls

| Key | Action |
| --- | --- |
| Space | Tap the beat |
| Left / Right | Previous / next song |
| 1–9, 0 | Jump to songs 1–10 |
| A | Pause time / mellow ambient scene |
| W | What’s next / timed agenda scene |
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
npm test                 # Tempo, motion, agenda timing, and persisted-state validation
npm run build            # Standard static build in dist/
npm run package          # Rebuild release/Donkey-Face.html; commit it with source changes
npm run test:browser     # Starts the Node server and tests the actual release over HTTP
```

Browser tests use `/usr/bin/chromium` by default. Set `CHROMIUM_PATH` to your Chromium executable elsewhere. Playwright starts and stops the included Node HTTP server automatically. Tests reject external network destinations and cover the exact served release bytes, HTTP behavior, two-window synchronization with normal browser messaging and with BroadcastChannel/storage events disabled, all ten scenes, tap tempo, motion pause, blackout, custom artwork, export served to a clean browser context, compact layout, and mobile overflow.

The cloud’s managed Chromium policy blocks `file://` navigation. The direct local-file check is explicitly skipped on that policy error; all other browser checks use real HTTP requests to the Node server. Direct opening on the concert machine remains a pre-show check; serving over HTTP is a tested alternative.

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
| Pause time — Between sets & conversations | Quiet hours / slow ambient ribbons, no band captions |
| What’s next — DevCon program | On the agenda / timed schedule with manual override |

The locally bundled Space Grotesk font uses the SIL Open Font License, included in `public/fonts/SpaceGrotesk-LICENSE.txt` and in the portable HTML.
