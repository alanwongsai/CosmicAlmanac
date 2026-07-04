# Archive — retired distribution artifacts

These pages are **retired, not deleted**. They were the per-channel
distribution setup used during the app's initial launch, kept here as
history because they're a fun record of how it was seeded.

They are **not part of the live site** — nothing links to them and they
aren't in the service-worker cache. They still resolve if you know the
URL (e.g. `/archive/meltcado.html`), but their QR codes and links point
at the old `alanwongsai.github.io/CosmicAlmanac/` paths (which now
301-redirect to `cosmic.meltcado.com`).

| File | What it was |
|------|-------------|
| `meltcado.html`, `wechat.html`, `instagram.html` | Per-channel landing stubs — each a distinct URL so Cloudflare Web Analytics could attribute traffic to its channel, then redirect into the app. |
| `share-card-meltcado.html`, `share-card-wechat.html`, `share-card-instagram.html` | The shareable cards for those channels, each with a QR pointing to its stub. |

Retired 2026-07-04, once the distribution period ended and channel
attribution was no longer needed. The generic `share-card.html` stays
live at the repo root.
