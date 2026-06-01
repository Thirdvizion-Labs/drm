class DRMVideoPlayer {
    constructor(videoElement, manifestUrl) {
        this.video = videoElement;
        this.manifestUrl = manifestUrl;
        this.hls = null;
    }

    async initialize() {
        if (Hls.isSupported()) {
            this.hls = new Hls();
            this.hls.loadSource(this.manifestUrl);
            this.hls.attachMedia(this.video);
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.video.play();
            });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            this.video.src = this.manifestUrl;
            this.video.addEventListener('loadedmetadata', () => this.video.play());
        }
    }

    destroy() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        this.video.src = '';
    }
}

function setupVideoStream(videoElement, manifestUrl) {
    const player = new DRMVideoPlayer(videoElement, manifestUrl);
    player.initialize();
    return player;
}
