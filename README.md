# AI-Story-Buddy

Expo app UI plus a small Node.js Express API for generating kids stories with OpenAI.

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

## Run Web

```bash
npm run web
```
