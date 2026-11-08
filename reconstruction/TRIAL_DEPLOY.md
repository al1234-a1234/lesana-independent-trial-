# Database-free Vercel preview

Set environment variable `TRIAL_NO_DATABASE=1` in the isolated Vercel project, then deploy this `reconstruction/` directory as project root. Do not set DATABASE_URL. This is a disposable functional demo: POST endpoints validate inputs and return success without persistent storage. Reloading loses progress, favorites and scores; UI may show optimistic completion before reload. Do not present it as durable or production-ready. Do not enable production until full build and smoke tests pass.
