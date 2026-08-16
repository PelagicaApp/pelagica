# Migration Guide for v3: Settings Are Now Per-Server

Pelagica settings, themes, and logos are now per Jellyfin server, so your existing settings won't carry over automatically after updating. Here is how to transfer your settings if you don't want to manually reconfigure elagica.

## Move your old settings over

If you only use one Jellyfin server with Pelagica and don't want to redo everything, you can move your old files into their new spot instead. You don't need to figure out the folder name yourself. Pelagica creates it for you.

1. Update and restart your Pelagica container.
2. Open Pelagica in your browser and log in as an admin, as usual.
3. Go to **Pelagica config** and flip any one toggle off and on again (anything, it doesn't matter which). This makes Pelagica save a settings file for your server and create its folder.
4. Look inside the `config` folder you mounted into the container (the one next to `docker-compose.yml`, e.g. `./config`). You'll now see a new folder under `config/servers/`. That's the one you need. It'll be named after your Jellyfin server's address.
5. Move your **old** files into that new folder, replacing what's there:

```bash
cd config
mv config.json servers/<the-new-folder-name>/config.json
mv themes servers/<the-new-folder-name>/themes
mv branding/branding servers/<the-new-folder-name>/branding
```

6. Restart the container and log in again. Your settings, themes, and logos should be back.

If you use more than one Jellyfin server with Pelagica, repeat steps 2–6 for each server.

## Server Address setting

The "Server Address" field that used to be in Pelagica config (used to prefill the login screen) has moved to an environment variable called `SERVER_ADDRESS`. Add it to your `docker-compose.yml` if you were using that feature:

```yaml
environment:
  - SERVER_ADDRESS=https://your-jellyfin-server.com
```