# Secretary

Backend and React client for the Secretary application.

The backend runs on Flask and is available by default at `https://localhost:5100`.

## Running the backend

```bash
python server/manage.py --mode development
```

## Running the React client

```bash
cd client
npm install
npm run dev
```

## Configuration

Configuration can be provided via environment variables or by editing
`server/app/config.py`. Two new variables control the webhook endpoints
used by the AI routes:

- `AI_WEBHOOK_URL` – base URL used for text based AI requests such as
  `/ai_record_fix` and `/ai_post_generate`.
- `AI_IMAGE_WEBHOOK_URL` – URL used for the `/generate-image` route.

If these variables are not set, the defaults from `config.py` will be used.
