# AI-Story-Buddy

Expo app UI plus a small Node.js Express API for generating kids stories with OpenAI.

## Structure

```text
.
|-- App.js
|-- app.json
|-- server.mjs
|-- src
|   |-- api
|   |   |-- config.mjs
|   |   |-- createApi.mjs
|   |   |-- routes
|   |   |   `-- storyRoutes.mjs
|   |   `-- services
|   |       `-- storyService.mjs
|   `-- app
|       `-- StoryBuddyApp.jsx
|-- api
|   `-- generate-story.mjs
|-- vercel.json
`-- README.md
```

## Production

The production deployment is hosted on Vercel:

https://ai-story-buddy-tau.vercel.app

The deployed app serves the Expo web build and uses the Vercel API route at:

```text
POST https://ai-story-buddy-tau.vercel.app/api/generate-story
```

## API

The backend exposes:

- `POST /generate-story`

Expected JSON body:

```json
{
  "age": "5-7",
  "characters": "Luna the fox, Milo the rabbit",
  "theme": "friendship in a magical forest"
}
```

Example response:

```json
{
  "title": "Luna and the Lantern Path",
  "story": "A short kids story goes here...",
  "moral": "Helping others makes every journey brighter."
}
```

## Environment Variables

Create a `.env` file from `.env.example` and add your real OpenAI key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.2
PORT=3000
```

## Run The API

```bash
npm install
npm run api
```

Health check:

```bash
GET http://localhost:3000/health
```

## Run The Expo App

```bash
npm start
```

The app calls `POST /generate-story` from the Story API. By default the UI points to
`http://localhost:3000`, and you can edit that in the app. When testing from Expo Go on a
physical phone, replace `localhost` with your computer's local network IP.

## Run Web

```bash
npm run web
```
