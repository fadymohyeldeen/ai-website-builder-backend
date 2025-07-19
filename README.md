# Stunning AI Backend

This is the backend for the Stunning AI Task project, built with NestJS and MongoDB.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Create a `.env` file** in the `stunning-ai-backend` directory with the following variables:

   ```env
   MONGODB_URI=mongodb://localhost:27017/ai_task
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PORT=3000
   ```

   - Adjust values as needed for your environment.

3. **Run the development server:**
   ```bash
   npm run start:dev
   ```

## Notes

- The backend connects to MongoDB using `MONGODB_URI`.
- The OpenRouter API key is required for AI generation (`OPENROUTER_API_KEY`).
- The server runs on the port specified by `PORT` (default: 3000).
- All configuration should be managed via the `.env` file.

## Testing

```bash
npm run test
npm run test:e2e
```

## License

MIT
