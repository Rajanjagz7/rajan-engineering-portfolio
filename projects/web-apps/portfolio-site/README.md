# Personal Portfolio Site

Source of [rajanjagwani.vercel.app](https://rajanjagwani.vercel.app): a single-page React app with a serverless contact form.

## Stack

- React 18 + Vite
- Vercel (static build + one serverless function, `api/contact.js`)
- Nodemailer for the contact form

## Structure

| Path | Purpose |
|---|---|
| `src/data/projects.js` | Project and experience catalogue (case studies, metrics, code snippets) |
| `src/data/skills.js` | Skills matrix and headline stats |
| `src/components/` | Page sections, project cards and the project modal |
| `api/contact.js` | Sends contact-form messages via Gmail SMTP |

## Run locally

```bash
npm install
npm run dev
```

The contact form needs two environment variables (see `.env.example`):

```
CONTACT_EMAIL_USER=<gmail address>
CONTACT_EMAIL_APP_PASSWORD=<gmail app password>
```

Never commit real values; set them in Vercel project settings.

## Deploy

```bash
vercel deploy --prod
```
