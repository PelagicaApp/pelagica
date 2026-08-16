# Pelagica for Tizen

## Tasks

```bash
task dev
task tizen:sim
task tizen:deploy TV_IP=192.168.1.50
```

## Plain browser

```bash
pnpm install
pnpm dev
```

Everything except real Tizen device APIs (`window.tizen`, hardware key events) works in a normal browser tab. Use this for UI/logic work and only drop to the simulator/device below to check TV-specific behavior.

## Build

```bash
pnpm build
```

Outputs a static bundle to `www/` (`build.outDir` in `vite.config.ts`). `vite.config.ts` sets `base: './'` so all asset URLs are relative, required for the widget to load from the packaged file root. `public/config.xml` and `public/icon.png` are copied verbatim into `www/` by Vite, alongside the built `index.html`. `config.xml` declares `<tizen:profile name="tv"/>`, the app id/package, icon, and privileges (`internet`, `tv.inputdevice`).

## Tizen Studio CLI setup (one-time)

Tizen Studio should be installed at `~/tizen-studio`. Put its CLI tools on `PATH`:

```bash
export PATH="$HOME/tizen-studio/tools/ide/bin:$HOME/tizen-studio/tools:$PATH"
```

Then create a local signing certificate and profile (Required before any package install. Pick your own password, this is a local dev keystore, not an account credential):

```bash
mkdir -p ~/tizen-studio-data/certs && cd ~/tizen-studio-data/certs
tizen certificate -a pelagica -f pelagica-author -p <password> -n "Your Name"
tizen security-profiles add -n pelagica -a ~/tizen-studio-data/certs/pelagica-author.p12 -p <password>
```

`package.json`'s `tizen:package` script already targets the `pelagica` profile name.

## Package as a widget (.wgt)

```bash
pnpm build
pnpm tizen:package
```

This runs `tizen package -t wgt -s pelagica -- www`, producing a `.wgt` in `www/`.

## Run it — three options

**1. Samsung TV Simulator:**

The bundled x86_64 Tizen emulator (`em-cli`) needs HAXM/KVM hardware virtualization, which isn't available on Apple Silicon, so `em-cli launch` fails there. The Samsung TV Simulator (`~/tizen-studio/tools/sec-tv-simulator`) is a separate NW.js-based runtime that isn't a full-system emulator, so it runs fine under Rosetta:

```bash
open ~/tizen-studio/tools/sec-tv-simulator/nwjs.app --args \
  --platform=tizentv --tizentvversion=2.0 --resolution=1920x1080 \
  --file="$(pwd)/www/index.html"
```

Opens a windowed simulator loading the built app directly (no install/sdb step needed — point it at a fresh `www/index.html` after each `pnpm build`).

**2. Real Samsung TV:**

Enable Developer Mode on the TV (Apps -> find any app -> hold Enter -> Developer mode -> set your devices IP), then:

```bash
sdb connect <tv-ip>:26101
tizen install -n www/<package-name>.wgt -t <tv-ip>:26101
tizen run -p Pel4g1c4Ap.pelagica -t <tv-ip>:26101
```

**3. x86_64 emulator (Intel Macs / Linux with KVM only):**

Two emulator images already exist (`T-10.0-x86_64`, `T-samsung-10.0-x86_64`):

```bash
~/tizen-studio/tools/emulator/bin/em-cli launch -n T-samsung-10.0-x86_64
tizen install -n www/<package-name>.wgt -t <emulator-serial>
```
