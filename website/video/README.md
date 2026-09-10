# Knap intro video

Native 3840 × 2160, 60 fps, silent H.264 MP4. The 27.12-second edit opens
with the social-card composition and the homepage cairn's original drop
and settling animations, then swipes down to the first live example in 200 ms.

The first example types a Markdown title and plot, then adds the blockquote
filter. Its completed output holds for 2.2 seconds. Both code areas clear for
600 ms while the labels and divider remain visible. During this pause the
divider and Output label move up 72 CSS pixels over 300 ms, making room for
the second example's cast output. The second example types its condition,
sorting filter, and table filter, then holds the finished table for 2.2 seconds.
The same 600 ms clear pause follows, with the divider and Output label moving
down 54 CSS pixels. The third example types YAML frontmatter, inserts the year,
and formats the directors as wikilinks with `yaml_property`. Its finished
output holds for 3.2 seconds.

The larger title uses 500 CSS pixel Inter at weight 850, alongside a 128 CSS
pixel cairn. The code scene is fully visible at 1.3
seconds, with an `--ink` background, 44 CSS pixel code and labels, and a divider spanning
the full video width. Content is inset 80 CSS pixels from the sides.

The renderer reads the running homepage and imports its typing timeline and
syntax highlighter. The cairn is an instance of the existing custom element;
its eight original Web Animations are paused and sampled at precise frame
times. The page is rendered at 1920 × 1080 CSS pixels with device scale 2,
producing native 4K frames without upscaling. PNG frames are piped to ffmpeg
with H.264 CRF 14, BT.709 color, and fast-start MP4 metadata.

## Render

Requires Node, Playwright, Google Chrome, and ffmpeg. Start the website:

```sh
cd website
pnpm dev --host 127.0.0.1 --port 4321
```

In another terminal, from the repository root:

```sh
node website/video/render.mjs
```

Use `--preview` to render only the nine 4K PNG stills. If Playwright is not
installed locally, set `PLAYWRIGHT_PATH` to its installed package directory.
Optional overrides: `SITE_URL`, `CHROME_PATH`, and `OUTPUT_DIR`.

Output is saved to the ignored `website/outputs/intro/` directory:

- `knap-intro-4k.mp4`
- `title.png`, `first-result.png`, `clear.png`, `clear-repositioned.png`,
  `typing.png`, `second-result.png`, `second-clear.png`,
  `second-clear-repositioned.png`, `result.png`
- `render-info.json`, including timing, final content, and animation metadata

The renderer does not change the homepage or publish the video.
