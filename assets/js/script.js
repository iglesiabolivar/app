// script.js

document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('play-pause-button');
    const playIcon = playPauseButton.querySelector('.play-icon');
    const pauseIcon = playPauseButton.querySelector('.pause-icon');
    const statusText = document.getElementById('player-status');

    let isPlaying = false;
    let hasAttemptedPlay = false; // Track if user initiated play
    let isLoading = false; // Track loading state

    const updateButtonState = () => {
        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline-block';
            playPauseButton.setAttribute('aria-label', 'Pausar');
            statusText.textContent = 'Transmitiendo en vivo...';
            statusText.classList.remove('error', 'loading');
            playPauseButton.classList.remove('loading');
            playPauseButton.classList.add('playing');
            isLoading = false;
        } else if (isLoading) {
            playIcon.style.display = 'none'; // Hide play icon while loading
            pauseIcon.style.display = 'none'; // Hide pause icon too
            playPauseButton.setAttribute('aria-label', 'Cargando');
             // Status text is handled by 'waiting' or 'loadstart'
            playPauseButton.classList.add('loading');
            playPauseButton.classList.remove('playing');
        } else {
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
            playPauseButton.setAttribute('aria-label', 'Reproducir');
            if (!statusText.classList.contains('error')) {
                 // Set initial or paused text only if not in error state
                 statusText.textContent = hasAttemptedPlay ? 'Pausado. Haz clic para reanudar.' : 'Haz clic en Play para comenzar';
            }
            playPauseButton.classList.remove('playing', 'loading');
            isLoading = false;
        }
    };

    const playAudio = async () => {
        // Prevent multiple simultaneous play attempts
        if (isLoading || isPlaying) return;

        hasAttemptedPlay = true;
        isLoading = true;
        statusText.textContent = 'Conectando...'; // Initial connecting message
        updateButtonState(); // Show loading state on button immediately

        try {
            // Ensure stream is loaded before playing
            if (audioPlayer.readyState < 1) { // HAVE_METADATA
                audioPlayer.load(); // Trigger loading if not already loading/loaded
                console.log("Triggering audio load...");
                 // Wait for 'canplay' or 'error' events to resolve loading state
            } else {
                 // If metadata is already available, attempt play directly
                console.log("Audio appears ready, attempting play...");
                await audioPlayer.play();
                // 'playing' event will handle isPlaying=true and update state
            }
        } catch (error) {
            console.error('Error attempting to play audio:', error);
            statusText.textContent = 'Error al iniciar. Intenta de nuevo.';
            statusText.classList.add('error');
            isLoading = false;
            isPlaying = false;
            updateButtonState();
        }
    };

     const pauseAudio = () => {
        audioPlayer.pause();
        isPlaying = false; // Explicitly set isPlaying to false on user pause
        isLoading = false; // Ensure loading is false
        updateButtonState();
    };

    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio(); // Attempt to play (handles loading state internally)
        }
    });

    audioPlayer.addEventListener('play', () => {
        // Stream started playing (not necessarily *fully* buffered)
        isPlaying = true;
        isLoading = false;
        updateButtonState();
    });

    audioPlayer.addEventListener('playing', () => {
        // Playback likely to continue without interruption
        isPlaying = true;
        isLoading = false;
        updateButtonState();
    });


    // Handle cases where playback stops unexpectedly (e.g., network drop)
    audioPlayer.addEventListener('pause', () => {
         // This event fires BOTH on user pause and unexpected pauses.
         // We only update if the state wasn't already set to paused by the user action.
         if (isPlaying) { // If it was playing and paused unexpectedly
            console.log("Playback paused unexpectedly or finished.");
            isPlaying = false;
            isLoading = false; // Ensure loading is false
            updateButtonState();
            // Don't show an error, just indicate it's paused.
             statusText.textContent = 'Pausado. Haz clic para reanudar.';
         }
         // If pauseAudio() was called, isPlaying is already false, and updateButtonState handled it.
    });

    audioPlayer.addEventListener('error', (e) => {
        console.error('Audio player error:', e);
        let message = 'Error de transmisión. Intenta de nuevo.';
        // Attempt to get more specific error if possible
        if (audioPlayer.error) {
            switch (audioPlayer.error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    message = 'Carga abortada. Intenta de nuevo.';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    message = 'Error de red. Revisa tu conexión.';
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    message = 'Error de decodificación de audio.';
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    message = 'Formato de audio no soportado.';
                    break;
                default:
                    message = 'Error desconocido. Intenta de nuevo.';
            }
        }
        statusText.textContent = message;
        statusText.classList.add('error');
        isPlaying = false;
        isLoading = false;
        updateButtonState();
    });

    audioPlayer.addEventListener('waiting', () => {
        // Waiting for data, buffering
        statusText.textContent = 'Cargando transmisión...'; // User requested text
        statusText.classList.remove('error');
        isLoading = true; // Set loading state
        isPlaying = false; // Not actively playing while waiting
        updateButtonState(); // Update button to show loading state
    });


    audioPlayer.addEventListener('loadstart', () => {
        console.log('Audio load started...');
        // Initial connection phase before data starts loading
        // Can keep 'Conectando...' or change to 'Cargando...' based on preference
        statusText.textContent = 'Cargando transmisión...'; // Changed as requested
        statusText.classList.remove('error');
        isLoading = true;
        updateButtonState();
    });

    audioPlayer.addEventListener('canplay', () => {
        console.log('Audio stream appears ready to play (canplay event).');
        // Stream has enough data to start playing
        isLoading = false; // No longer actively loading initial buffer
        statusText.classList.remove('error');

        // If the user clicked play while it was loading, it might auto-play now
        // or require another play() call depending on browser.
        // The 'playing' event is a more reliable indicator of actual playback start.
        // If it's not playing yet, update status.
        if (!isPlaying) {
             statusText.textContent = hasAttemptedPlay ? 'Listo. Reanudando...' : 'Listo. Haz clic en Play.';
             // We might need to call play() again if autoplay didn't happen after 'canplay'
             if(hasAttemptedPlay) {
                 // Small delay might help ensure context is ready
                 setTimeout(() => {
                     if(!isPlaying) { // Check again if 'playing' event fired
                        audioPlayer.play().catch(e => {
                             console.error("Error retrying play after canplay:", e);
                             // Handle error state again if needed
                             statusText.textContent = 'Error al reanudar.';
                             statusText.classList.add('error');
                             isPlaying = false;
                             isLoading = false;
                             updateButtonState();
                        });
                     }
                 }, 100); // 100ms delay
             }
        }
        updateButtonState(); // Reflect loading finished if not playing yet
    });

    // Initial setup
    updateButtonState(); // Set initial button state (should show play icon)
});