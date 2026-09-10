# ashisharcverex.github.io

Source for the [arcverex](https://arcverex.io) site, served via GitHub Pages.

Static HTML, CSS, and JavaScript, with no dependencies or build step.

## Local preview

From this directory, run:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open [localhost:8765](http://localhost:8765).

## Robot engineering session

The background follows one 40-second engineering session:

- **Left: a robot engineer's terminal.** Syntax-colored RTL is typed into an
  editor, followed by elaboration logs, design checks, and a testbench transcript.
  A small robot in the corner glances at the code, blinks, and smiles on completion.
- **Right: a 4-bit ALU schematic.** XOR, AND, and OR gates draw progressively,
  followed by the interconnects, ripple-carry chain, four-input multiplexers,
  and output registers. The finished drawing animates ADD, XOR, AND, and OR
  examples. Wire colors follow the gate equations; output registers hold their
  values until the illustrated clock edge.

Both sides share the same phase, inputs, and clock edge. A PASS row appears only
after the corresponding schematic output is captured. The schematic stays free
of text; labels and numeric results appear inside the terminal only.

The terminal is an illustrative transcript, not a connected shell or live HDL
compiler. Its displayed vectors come from the same gate equations that drive the
schematic. The completion count comes from checking all 1,024 ALU combinations
in JavaScript against independent arithmetic and bitwise reference expressions.

- `index.html` contains the site content and accessible animation controls.
- `careers.html` contains the hiring information and a link back to the homepage.
- `site.css` shares typography and content panels across the two pages.
- `page-layout.css` keeps each page compact and sizes the narrow-screen views.
- `workbench.js` owns shared playback, layout, and theme controls.
- `engineering-session.js` owns phases, ALU gate equations, vectors, and verification.
- `schematic-scene.js` owns the cached gate paths and progressive drawing.
- `terminal-scene.js` owns the editor, transcript, and robot expressions.
- `terminal-scene.css` styles the terminal and its inline SVG robot.
- `chip-scene.css` defines the light/dark palettes and responsive composition.

Below 1200px, the view switch shows the page's copy, the terminal, or the schematic.
The copy is selected initially; an illustration uses the available viewport space
when selected. The animation pauses while reading the copy, when the tab is
hidden, or when the illustration is offscreen. The pause button freezes both scenes;
`prefers-reduced-motion` shows a completed, static session, including the robot.
Schematic paths are constructed once, and transcript updates are limited to 24Hz.
Canvas density is capped to limit rendering cost on large displays.

Tune `duration`, `phases`, and `vectors` in `engineering-session.js` to adjust the
session. All visuals are generated in the browser; there are no image downloads,
WebGL requirements, external libraries, or fonts.

The previous silicon assembly is preserved as a self-contained
[archived preview](archive/silicon-assembly/). Its original layout pairs the
schematic on the left with the isometric chip on the right.

## Deployment

GitHub Pages serves the files directly. Publishing changes to `main` deploys the
site; `CNAME` retains the `arcverex.io` domain.
