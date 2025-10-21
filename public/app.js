// State management
let currentVideos = [];
let currentSource = 'liked';
let playlists = [];

// DOM elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginPrompt = document.getElementById('login-prompt');
const loggedIn = document.getElementById('logged-in');
const mainSection = document.getElementById('main-section');
const pickRandomBtn = document.getElementById('pick-random-btn');
const videoCount = document.getElementById('video-count');
const resultSection = document.getElementById('result-section');
const videoResult = document.getElementById('video-result');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const sourceBtns = document.querySelectorAll('.source-btn');
const playlistSelector = document.getElementById('playlist-selector');
const playlistSelect = document.getElementById('playlist-select');

// Event listeners
loginBtn.addEventListener('click', () => {
    window.location.href = '/auth';
});

logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout');
    location.reload();
});

sourceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sourceBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSource = btn.dataset.source;

        if (currentSource === 'playlist') {
            playlistSelector.style.display = 'block';
            if (playlists.length === 0) {
                loadPlaylists();
            }
        } else {
            playlistSelector.style.display = 'none';
            loadVideos();
        }
    });
});

playlistSelect.addEventListener('change', () => {
    if (playlistSelect.value) {
        loadVideos();
    }
});

pickRandomBtn.addEventListener('click', () => {
    if (currentVideos.length === 0) {
        showError('No videos available to pick from');
        return;
    }

    const randomIndex = Math.floor(Math.random() * currentVideos.length);
    const randomVideo = currentVideos[randomIndex];

    displayVideo(randomVideo);
});

// Functions
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth-status');
        const data = await response.json();

        if (data.authenticated) {
            showLoggedIn();
            loadVideos();
        } else {
            showLoginPrompt();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showLoginPrompt();
    }
}

function showLoginPrompt() {
    loginPrompt.style.display = 'block';
    loggedIn.style.display = 'none';
    mainSection.style.display = 'none';
}

function showLoggedIn() {
    loginPrompt.style.display = 'none';
    loggedIn.style.display = 'block';
    mainSection.style.display = 'block';
}

async function loadVideos() {
    showLoading();
    hideError();
    resultSection.style.display = 'none';

    try {
        let endpoint;

        switch(currentSource) {
            case 'liked':
                endpoint = '/api/videos/liked';
                break;
            case 'watch-later':
                endpoint = '/api/videos/watch-later';
                break;
            case 'playlist':
                const playlistId = playlistSelect.value;
                if (!playlistId) {
                    hideLoading();
                    return;
                }
                endpoint = `/api/videos/playlist/${playlistId}`;
                break;
            default:
                endpoint = '/api/videos/liked';
        }

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error('Failed to fetch videos');
        }

        const data = await response.json();
        currentVideos = data.videos;

        updateVideoCount(data.count);
        pickRandomBtn.disabled = data.count === 0;

        if (data.count === 0) {
            showError('No videos found in this source');
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        showError('Failed to load videos. Please try again.');
        pickRandomBtn.disabled = true;
    } finally {
        hideLoading();
    }
}

async function loadPlaylists() {
    try {
        playlistSelect.innerHTML = '<option value="">Loading playlists...</option>';

        const response = await fetch('/api/playlists');

        if (!response.ok) {
            throw new Error('Failed to fetch playlists');
        }

        const data = await response.json();
        playlists = data.playlists;

        if (playlists.length === 0) {
            playlistSelect.innerHTML = '<option value="">No playlists found</option>';
            return;
        }

        playlistSelect.innerHTML = '<option value="">Select a playlist...</option>';
        playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.id;
            option.textContent = `${playlist.title} (${playlist.itemCount} videos)`;
            playlistSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading playlists:', error);
        playlistSelect.innerHTML = '<option value="">Error loading playlists</option>';
    }
}

function displayVideo(video) {
    resultSection.style.display = 'block';

    videoResult.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
        <div class="video-title">${video.title}</div>
        <div class="video-channel">Channel: ${video.channelTitle}</div>
        ${video.description ? `<div class="video-description">${truncateText(video.description, 200)}</div>` : ''}
        <a href="${video.url}" target="_blank" class="video-link">Watch on YouTube</a>
    `;

    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateVideoCount(count) {
    const sourceName = currentSource === 'liked' ? 'Liked Videos' :
                      currentSource === 'watch-later' ? 'Watch Later' :
                      'Selected Playlist';
    videoCount.textContent = `Found ${count} video${count !== 1 ? 's' : ''} in ${sourceName}`;
}

function showLoading() {
    loading.style.display = 'block';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Check for auth callback
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('auth') === 'success') {
    // Remove query params from URL
    window.history.replaceState({}, document.title, '/');
}

// Initialize
checkAuthStatus();
