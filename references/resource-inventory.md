# Resource Inventory

## Downloaded Open/Public Resources

Public standards referenced by `docs/solution1.md` have been downloaded for local reference:

- `references/public-standards/shanghai-urban-road-maintenance-code.pdf`
- `references/public-standards/hubei-manhole-repair-standard.pdf`
- `references/public-standards/shenzhen-drainage-manhole-code.pdf`

Open-source Codex resources:

- Official OpenAI curated skills installed to `~/.codex/skills`.
  - Source: `openai/skills`
  - Commit used: `a8924c2a35cfa290458852c4fad17c9133054c2e`
  - Installed skills: `define-goal`, `playwright`, `playwright-interactive`, `security-best-practices`, `security-threat-model`, `gh-fix-ci`, `figma-generate-design`, `figma-implement-design`, `figma-create-design-system-rules`.
- Selected Composio community skills installed to `~/.codex/skills`.
  - Source: `ComposioHQ/awesome-codex-skills`
  - Commit used: `9c9da64cf1bbea611d43dd14a10788d55369b353`
  - Installed skills: `create-plan`, `webapp-testing`.
  - Note: the installer hit a temporary directory conflict for this repo, so these two directories were copied from a local shallow clone.
- Selected VoltAgent community subagents copied into `.codex/agents`.
  - Source: `VoltAgent/awesome-codex-subagents`
  - Commit used: `797d73698aa32e27938ddfa76a5170f7b26aeefd`
  - License and upstream README snapshots:
    - `references/open-source/LICENSE.awesome-codex-subagents`
    - `references/open-source/README.awesome-codex-subagents.md`
  - Copied agents: `api-designer`, `backend-developer`, `frontend-developer`, `ui-designer`, `nextjs-developer`, `fastapi-developer`, `postgres-pro`, `docker-expert`, `qa-expert`, `reviewer`, `security-auditor`.

## User-Provided References

- `docs/solution1.md`
- `docs/demo1.md`
- `references/solution.md`
- `references/demo-requirements.md`

## Non-Open Resources To Provide Later

Do not commit private customer data until ownership and permission are clear.

Expected resources:
- Real or semi-real manhole surface photos;
- GPR B-scan/C-scan sample images;
- city GIS boundary or road network data;
- real inspection spreadsheet, if available;
- material performance report;
- construction process photos or videos;
- customer logo and visual identity;
- Figma file or existing design system;
- Mapbox token, if Mapbox is chosen instead of Leaflet/OpenStreetMap;
- demo voiceover, animation brand style, physical model photos.

Placeholders:
- `assets/demo/photos/`
- `assets/demo/radar/`
- `assets/demo/heatmaps/`
- `assets/demo/simulation/`
- `assets/demo/physical-model/`
- `assets/demo/video/`
