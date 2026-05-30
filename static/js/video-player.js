class DRMVideoPlayer {
    constructor(videoElement, streamUrl, encryptionKey) {
        this.video = videoElement;
        this.streamUrl = streamUrl;
        this.encryptionKey = encryptionKey;
        this.bufferSize = 1024 * 1024;
        this.decryptedCache = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            this.video.src = this.streamUrl;
            this.video.crossOrigin = 'anonymous';
            
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('DRM Video Player initialized');
        } catch (error) {
            console.error('Failed to initialize DRM player:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded:', this.video.duration);
        });

        this.video.addEventListener('play', () => {
            console.log('Video playback started');
        });

        this.video.addEventListener('pause', () => {
            console.log('Video playback paused');
        });

        this.video.addEventListener('ended', () => {
            console.log('Video playback ended');
        });

        this.video.addEventListener('error', (e) => {
            console.error('Video error:', e);
        });

        this.video.addEventListener('timeupdate', () => {
            this.onTimeUpdate();
        });
    }

    onTimeUpdate() {
        const currentTime = Math.floor(this.video.currentTime);
        if (currentTime % 10 === 0) {
            console.log(`Current time: ${currentTime}s`);
        }
    }

    async getDecryptionKey() {
        return this.encryptionKey;
    }

    decryptChunk(encryptedData) {
        const decoder = new TextDecoder();
        const encryptedText = decoder.decode(encryptedData);
        
        const timestamp = Date.now();
        const mockDecrypted = encryptedText;
        
        const encoder = new TextEncoder();
        return encoder.encode(mockDecrypted);
    }

    play() {
        this.video.play().catch(error => {
            console.error('Play failed:', error);
        });
    }

    pause() {
        this.video.pause();
    }

    seek(time) {
        this.video.currentTime = time;
    }

    setVolume(volume) {
        this.video.volume = Math.max(0, Math.min(1, volume));
    }

    destroy() {
        this.decryptedCache.clear();
        this.video.src = '';
        this.isInitialized = false;
    }
}

window.DRMVideoPlayer = DRMVideoPlayer;

function setupVideoStream(videoElement, streamUrl, encryptionKey) {
    const player = new DRMVideoPlayer(videoElement, streamUrl, encryptionKey);
    player.initialize();
    return player;
}
