# Restore the redirect to projectcrewai.io

GitHub Pages publishes the root of the `main` branch:

https://sheabuttanyoi.github.io/ai-agents-intelligence-briefs/

While projectcrewai.io is down, that root is the temporary Project Crew AI landing page (`index.html`).

## Put the old redirect back

1. Replace `index.html` with `redirect-to-io.html`.
   `redirect-to-io.html` is the previous root page. It sends visitors to https://projectcrewai.io/.
2. Replace `404.html` with the same redirect, so unknown paths leave GitHub Pages again.
   Before this temporary page, `404.html` was identical to the root redirect.
3. Commit those two files and push to `main`.
   Pages rebuilds from `main`. After the build finishes, the root URL redirects to projectcrewai.io again.

```sh
cp redirect-to-io.html index.html
cp redirect-to-io.html 404.html
git add index.html 404.html
git commit -m "Restore the redirect to projectcrewai.io."
git push origin main
```

## What was left alone

- `/backup/` is the earlier landing page and was not edited.
- `logo.jpg` stays at the repo root.
- `AI_Agents_Intelligence_Brief_Sample.pdf` and `ai-and-2027.pdf` stay at the repo root.

The wordmark in the header is `images/wordmark.png`, cut from `logo.jpg` with the black background removed. The intro mark is `images/pa-mark.png`, the same PA icon as `images/pa-site-icon-1024.png` with the black background removed so the red glow can sit behind the shape.
