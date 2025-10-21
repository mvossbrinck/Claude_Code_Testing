require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// YouTube API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly'
];

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initiate OAuth flow
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

// OAuth callback
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in session
    req.session.tokens = tokens;

    res.redirect('/?auth=success');
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.redirect('/?auth=error');
  }
});

// Check authentication status
app.get('/api/auth-status', (req, res) => {
  res.json({ authenticated: !!req.session.tokens });
});

// Logout
app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get saved videos (liked videos)
app.get('/api/videos/liked', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.videos.list({
      part: 'snippet,contentDetails',
      myRating: 'like',
      maxResults: 50 // You can adjust this or implement pagination
    });

    const videos = response.data.items.map(item => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id}`
    }));

    res.json({ videos, count: videos.length });
  } catch (error) {
    console.error('Error fetching liked videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get videos from Watch Later playlist
app.get('/api/videos/watch-later', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // First, get the Watch Later playlist ID
    const channelsResponse = await youtube.channels.list({
      part: 'contentDetails',
      mine: true
    });

    const watchLaterPlaylistId = channelsResponse.data.items[0].contentDetails.relatedPlaylists.watchLater;

    // Then get videos from Watch Later playlist
    const playlistResponse = await youtube.playlistItems.list({
      part: 'snippet,contentDetails',
      playlistId: watchLaterPlaylistId,
      maxResults: 50
    });

    const videos = playlistResponse.data.items.map(item => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`
    }));

    res.json({ videos, count: videos.length });
  } catch (error) {
    console.error('Error fetching Watch Later videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get videos from any playlist
app.get('/api/videos/playlist/:playlistId', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { playlistId } = req.params;

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const playlistResponse = await youtube.playlistItems.list({
      part: 'snippet,contentDetails',
      playlistId: playlistId,
      maxResults: 50
    });

    const videos = playlistResponse.data.items.map(item => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`
    }));

    res.json({ videos, count: videos.length });
  } catch (error) {
    console.error('Error fetching playlist videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos from playlist' });
  }
});

// Get user's playlists
app.get('/api/playlists', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.playlists.list({
      part: 'snippet,contentDetails',
      mine: true,
      maxResults: 50
    });

    const playlists = response.data.items.map(item => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      itemCount: item.contentDetails.itemCount,
      thumbnail: item.snippet.thumbnails?.default?.url
    }));

    res.json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure you have set up your .env file with YouTube API credentials');
});
