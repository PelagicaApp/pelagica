<p align="center">
  <img height="80px" width="80px" src="https://pelagica.app/logo/logo_pride.svg" alt="Pelagica logo">
  <h1 align="center"><b>Pelagica</b></h1>
</p>

<p align="center">
  <a href="https://github.com/PelagicaApp/pelagica/releases/latest"><img src="https://img.shields.io/github/v/release/PelagicaApp/pelagica" alt="Latest Release"></a>
  <a href="https://github.com/PelagicaApp/pelagica/blob/main/LICENSE"><img src="https://img.shields.io/github/license/PelagicaApp/pelagica" alt="License"></a>
  <a href="https://hub.docker.com/r/kartoffelchipss/pelagica"><img src="https://img.shields.io/docker/pulls/kartoffelchipss/pelagica" alt="Docker Pulls"></a>
  <img src="https://img.shields.io/github/stars/PelagicaApp/pelagica?style=flat&color=gold" alt="Stars">
  <a href="https://stats.pelagica.app/"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fstats.pelagica.app%2Fstats&label=active%20instances&query=%24.active_instances&color=brightgreen" alt="Active Instances"></a>
</p>

<p align="center">Pelagica is an alternative web frontend for <a href="https://jellyfin.org">Jellyfin</a> built using React. It aims to provide a fast, modern, and customizable user experience for browsing and watching your media library.</p>

<!-- p align="center">A fast, modern web frontend for Jellyfin</p> -->

![Home](./.github/assets/home.webp)

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Docker Installation](#docker-installation)
- [Custom Themes](#custom-themes)
- [Discord](#discord)
- [Localization](#localization)
- [Development Setup](#development-setup)
- [Contributing](#contributing)
- [What does that name mean?](#what-does-that-name-mean)
- [Acknowledgements](#acknowledgements)
- [Disclaimer](#disclaimer)
- [License](#license)

## Features

- **Customizable Sections:** Tailor your homepage with sections like "Continue Watching", "Recently Added", or completely custom queries.
- **Media Bars:** Add custom media bars to feature specific content.
- **Search:** Quickly find media across your library from anywhere using `Cmd+K` / `Ctrl+K`.
- **Video Player:** Integrated video player for movies and TV shows.
- **Music Player:** A music player that allows you to listen to your music albums or playlists while browsing your library.
- **Responsive Design:** Works seamlessly on both desktop and mobile devices.
- **Theming:** Light and dark mode support as well as custom themes
- **Localization:** Supports multiple languages through [community contributions](https://gitlocalize.com/repo/10758).

You can find a roadmap of planned features and improvements in the [GitHub Projects](https://github.com/users/KartoffelChipss/projects/7).

If you want to suggest new features or report bugs, please use the [GitHub Issues](https://github.com/KartoffelChipss/pelagica/issues) section.

### Integrated Services

- **Streamystats:** Get your streamystats recommendations directly on your home page.
- **kefintweaks Watchlist:** View and manage your kefintweaks watchlist within Pelagica.

### Screenshots

<table>
  <tr>
    <td>
      <img src="./.github/assets/library.webp" />
    </td>
    <td>
      <img src="./.github/assets/series_page.webp" />
    </td>
  </tr>
  <tr>
    <td>
      <img src="./.github/assets/episode_page.webp" />
    </td>
    <td>
      <img src="./.github/assets/music.webp" />
    </td>
  </tr>
</table>

> Screenshots may include media artwork used for demonstration purposes only.

## Demo

You can find a live demo of Pelagica at:

https://demo.pelagica.app/

The demo instance has the `jellyfin.streamyfin.app` server with a username preconfigured, so you just have to click "Login" to test it out. If your own Jellyfin server is publicly accessible, you can also use that by entering the server URL and your credentials.

For production use, you should self-host Pelagica using Docker or another method.

Thank you to [Streamyfin](https://streamyfin.app/) for providing a demo Jellyfin server for testing!

## Docker Installation

The easiest way to run Pelagica is using Docker. This provides a production-ready setup with nginx web server.

### Quick Start

1. **Create a directory for Pelagica:**

    ```bash
    mkdir -p pelagica && cd pelagica
    ```

2. **Run the container:**

    ```bash
    docker run -d \
      --name pelagica \
      -p 8080:80 \
      -v "$(pwd)/config:/config" \
      --restart unless-stopped \
      kartoffelchipss/pelagica:latest
    ```

    Make sure to replace `$(pwd)/config` with the actual path where your config files should be located (e.g. `/mnt/user/appdata/pelagica`)

3. **Access Pelagica:**

    Open your browser to http://localhost:8080

### Container Management

```bash
# View logs
docker logs -f pelagica

# Stop the container
docker stop pelagica

# Start the container
docker start pelagica

# Update to latest version
docker pull kartoffelchipss/pelagica:latest
docker stop pelagica
docker rm pelagica
# Then run the docker run command again from Quick Start
```

### Using Docker Compose

If you prefer using docker-compose, create a `docker-compose.yml` file:

```yaml
services:
    pelagica:
        image: kartoffelchipss/pelagica:latest
        container_name: pelagica
        ports:
            - '8080:80'
        volumes:
            - /path/to/your/config:/config
        restart: unless-stopped
```

Replace `/path/to/your/config` with the actual path where your config files should be located (e.g. `/mnt/user/appdata/pelagica`)

Then run: `docker-compose up -d`

### Building from Source

If you want to build the Docker image from source instead of using prebuilt images:

```bash
# Clone the repository
git clone https://github.com/KartoffelChipss/pelagica.git
cd pelagica

# Build and start
docker-compose up -d --build
```

## Custom Themes

You can find instructions on how to build and/or publish custom themes [here](https://github.com/KartoffelChipss/pelagica-themes#readme).

## Discord

For discussions about Pelagica, join the [JellyfinCommunity](https://discord.gg/VKqprjh3Wr) and head to the `#pelagica` channel.

## Localization

Pelagica supports multiple languages and depends on community contributions for translations. If you'd like to help translate Pelagica into your language, you can contribute via [GitLocalize](https://gitlocalize.com/repo/10758).

## Development Setup

### Prerequisites

| Tool                                       | Version |
| ------------------------------------------ | ------- |
| [Go](https://go.dev/dl/)                   | 1.25+   |
| [Node.js](https://nodejs.org/)             | 24.16+  |
| [pnpm](https://pnpm.io/installation)       | latest  |
| [Task](https://taskfile.dev/installation/) | latest  |

### Running the dev environment

Dependencies are installed automatically on first run (and whenever `package.json`, `pnpm-lock.yaml`, `go.mod`, or `go.sum` change).

```bash
task dev
```

This starts both the frontend (http://localhost:3000) and backend in parallel.

You can also run them individually:

```bash
task frontend   # Vite dev server only
task backend    # Go backend only
```

To see all available tasks:

```bash
task --list
```

## Contributing

Issues and pull requests are welcome.
Please open an issue to discuss larger changes before submitting a PR.

## What does that name mean?

You might be wondering about the name "Pelagica". Since I didn't want to call it the usual "\*fin" or "jelly\*" names, I looked for synonyms related to the sea. "Pelagic" refers to living in the deep ocean, which felt fitting for a Jellyfin frontend.

## Acknowledgements

Pelagica’s design was inspired by the [finetic](https://github.com/AyaanZaveri/finetic) Jellyfin frontend.  
No code was used; this project is an independent implementation.

## Disclaimer

This project is a third-party frontend for Jellyfin and is not affiliated with the Jellyfin project.

Jellyfin is a media server designed to organize and stream legally obtained media. This project does not provide, host, or encourage access to pirated content.

The movie posters and images shown in the examples are not owned by me and are only used for demonstration purposes. All rights belong to their respective owners.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](./LICENSE) file for details.
