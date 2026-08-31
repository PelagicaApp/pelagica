# Pelagica for webOS

## Tasks

```bash
task dev
task webos:device:add TV_IP=192.168.1.50 PASSPHRASE=123456
task webos:tv:deploy
```

## Plain browser

```bash
pnpm install
pnpm dev
```

Everything except real webOS device APIs (`window.PalmSystem`, `WebOSServiceBridge`, hardware key events) works in a normal browser tab.

## Build

```bash
pnpm build
```

Outputs a static bundle to `www/` (`build.outDir` in `vite.config.ts`). `vite.config.ts` sets `base: './'` so all asset URLs are relative, required for the app to load from the packaged file root. `public/appinfo.json`, `public/icon.png`, and `public/largeIcon.png` are copied verbatim into `www/` by Vite, alongside the built `index.html`.

## webOS TV CLI setup (one-time)

Install the official CLI (pure npm package, no separate SDK download required):

```bash
npm install -g @webos-tools/cli
```

Enable **Developer Mode** on the TV via the "Developer Mode" app (LG Content Store), which shows the TV's IP address and a 6-character passphrase.

## Package as an app (.ipk)

```bash
pnpm build
pnpm webos:package
```

This runs `ares-package www -o .`, producing an unsigned `.ipk` in this directory (no signing/certificate step is required for sideloading via Developer Mode, unlike Tizen).

## Run it — two options

**1. Real LG TV (Developer Mode):**

Register the TV as a CLI target once (get the IP/passphrase from the Developer Mode app):

```bash
task webos:device:add TV_IP=<tv-ip> PASSPHRASE=<passphrase>
```

Then build, package, install, and launch in one shot:

```bash
task webos:tv:deploy
```

Or step by step:

```bash
ares-package www -o .
ares-install -d pelagica-tv app.pelagica.pelagica_4.5.2_all.ipk
ares-launch app.pelagica.pelagica -d pelagica-tv
```

**2. Fast iteration without installing:**

`ares-launch -H` runs a built `www/` directory directly off disk on a registered device, skipping the package/install step entirely:

```bash
task webos:build
task webos:tv:hosted
```

**3. webOS TV Simulator:**

LG ships a GUI simulator (not CLI-scriptable) as part of [webOS Studio](https://webostv.developer.lge.com/develop/tools/webos-studio-introduction) (VS Code extension) or as a standalone download from the [webOS TV Developer site](https://webostv.developer.lge.com/develop/tools/simulator-installation). Point it at this project's `www/` folder after `pnpm build`.
