# YouTube Random Video Picker

A web application that connects to your YouTube account and randomly picks videos from your saved videos, liked videos, watch later playlist, or any custom playlist.

## Features

- OAuth 2.0 authentication with YouTube
- Pick random videos from:
  - Liked Videos
  - Watch Later playlist
  - Custom playlists
- Clean, modern user interface
- Direct links to watch selected videos on YouTube

## Prerequisites

- Node.js (v14 or higher)
- A Google Cloud Platform account
- YouTube API credentials

## Setup Instructions

### 1. Get YouTube API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/oauth2callback`
   - Click "Create"
   - Copy your Client ID and Client Secret

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:
```
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3000/oauth2callback
SESSION_SECRET=your_random_session_secret_here
PORT=3000
```

### 4. Run the Application

Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### 5. Use the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Connect to YouTube" to authenticate
3. Grant the necessary permissions
4. Select your video source (Liked Videos, Watch Later, or Custom Playlist)
5. Click "Pick Random Video" to get a random selection
6. Click "Watch on YouTube" to view the video

## How It Works

1. **Authentication**: Uses OAuth 2.0 to securely connect to your YouTube account
2. **Video Fetching**: Retrieves videos from your selected source using the YouTube Data API
3. **Random Selection**: Uses JavaScript's `Math.random()` to select a random video from the fetched list
4. **Display**: Shows video details including thumbnail, title, channel, and description

## API Endpoints

- `GET /auth` - Initiates OAuth flow
- `GET /oauth2callback` - OAuth callback handler
- `GET /api/auth-status` - Check authentication status
- `GET /api/logout` - Logout user
- `GET /api/videos/liked` - Fetch liked videos
- `GET /api/videos/watch-later` - Fetch Watch Later videos
- `GET /api/videos/playlist/:playlistId` - Fetch videos from a specific playlist
- `GET /api/playlists` - Fetch user's playlists

## Security Notes

- Never commit your `.env` file to version control
- Keep your Client Secret secure
- The session secret should be a long, random string
- For production deployment, use HTTPS and update the OAuth redirect URI accordingly

## Limitations

- Currently fetches up to 50 videos per source (YouTube API limitation)
- Requires internet connection to authenticate and fetch videos
- Requires valid YouTube API quota

## Troubleshooting

**"Failed to fetch videos"**
- Check that you've granted the necessary permissions
- Verify your API credentials are correct
- Ensure the YouTube Data API v3 is enabled in your Google Cloud Console

**"No videos found"**
- Make sure you have videos in the selected source
- Try a different video source

**Authentication issues**
- Clear your browser cookies and try again
- Verify the redirect URI matches in both your `.env` file and Google Cloud Console

## License

MIT
