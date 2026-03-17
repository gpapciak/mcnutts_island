# McNutt's Island Alliance — Static Site

Static HTML/CSS/JS version of the McNutt's Island Alliance website, deployable on GitHub Pages.

## Deployment

1. Push this repository to GitHub
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch**, select `main`, folder `/` (root)
4. The custom domain `mcnuttsisland.org` is set via the `CNAME` file

## Updating Dynamic Content

### Member count (index.html)
Find `<!-- UPDATE: member count -->` and change the number in `.stat-callout__number`.

### Events (index.html)
Find `<!-- UPCOMING EVENTS -->` and add event cards following the template in the comments.

### Naming poll results (naming.html)
Find `<!-- RESULTS: update data-width="0" with actual percentages -->` and update the `data-width` attributes on `.results-bar__fill` elements. Also update the vote count spans.

### Community join form
Replace `GOOGLE_FORM_URL_HERE` in `community.html` with your actual Google Form URL.

### Bearing Witness form
Replace `GOOGLE_FORM_URL_HERE` in `bearing-witness.html` with your actual Google Form URL.

### Naming vote form
Replace `GOOGLE_FORM_URL_HERE` in `naming.html` with your actual Google Form URL.

## File Structure

```
/
├── index.html
├── island.html
├── flora-fauna.html
├── activities.html
├── community.html
├── naming.html
├── bearing-witness.html
├── about.html
├── 404.html
├── CNAME
├── sw.js
├── favicon.svg
├── css/
│   └── main.css
├── js/
│   └── main.js
└── images/
    └── (all site images)
```
