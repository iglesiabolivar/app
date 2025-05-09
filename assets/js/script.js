document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('play-pause-button');
    const playIcon = playPauseButton.querySelector('.play-icon');
    const pauseIcon = playPauseButton.querySelector('.pause-icon');
    const spinner = playPauseButton.querySelector('.spinner');
    const statusText = document.getElementById('player-status');

    let isPlaying = false;
    let hasAttemptedPlay = false;
    let isLoading = false;

    const updateButtonState = () => {
        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline-block';
            spinner.style.display = 'none';
            playPauseButton.setAttribute('aria-label', 'Pausar');
            statusText.textContent = 'Transmitiendo en vivo...';
            statusText.classList.remove('error', 'loading');
            playPauseButton.classList.remove('loading');
            playPauseButton.classList.add('playing');
            isLoading = false;
        } else if (isLoading) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'none';
            spinner.style.display = 'block';
            playPauseButton.setAttribute('aria-label', 'Cargando');
            statusText.textContent = 'Conectando...';
            playPauseButton.classList.add('loading');
            playPauseButton.classList.remove('playing');
        } else {
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
            spinner.style.display = 'none';
            playPauseButton.setAttribute('aria-label', 'Reproducir');
            if (!statusText.classList.contains('error')) {
                statusText.textContent = hasAttemptedPlay
                    ? 'Pausado. Haz clic para reanudar.'
                    : 'Haz clic en Play para comenzar';
            }
            playPauseButton.classList.remove('playing', 'loading');
            isLoading = false;
        }
    };

    const playAudio = async () => {
        if (isLoading || isPlaying) return;

        hasAttemptedPlay = true;
        isLoading = true;
        statusText.textContent = 'Conectando...';
        updateButtonState();

        try {
            if (audioPlayer.readyState < 1) {
                audioPlayer.load();
            }
            await audioPlayer.play();
        } catch (error) {
            console.error('Error al intentar reproducir el audio:', error);
            statusText.textContent = 'Error al iniciar. Intenta de nuevo.';
            statusText.classList.add('error');
            isLoading = false;
            isPlaying = false;
            updateButtonState();
        }
    };

    const pauseAudio = () => {
        audioPlayer.pause();
        isPlaying = false;
        isLoading = false;
        updateButtonState();
    };

    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    });

    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        isLoading = false;
        updateButtonState();
    });

    audioPlayer.addEventListener('playing', () => {
        isPlaying = true;
        isLoading = false;
        updateButtonState();
    });

    audioPlayer.addEventListener('pause', () => {
        if (isPlaying) {
            isPlaying = false;
            isLoading = false;
            statusText.textContent = 'Pausado. Haz clic para reanudar.';
            updateButtonState();
        }
    });

    audioPlayer.addEventListener('error', (e) => {
        console.error('Error en el reproductor de audio:', e);
        let message = 'Error de transmisión. Intenta de nuevo.';
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
        statusText.textContent = 'Cargando transmisión...';
        statusText.classList.remove('error');
        isLoading = true;
        isPlaying = false;
        updateButtonState();
    });

    audioPlayer.addEventListener('loadstart', () => {
        statusText.textContent = 'Cargando transmisión...';
        statusText.classList.remove('error');
        isLoading = true;
        updateButtonState();
    });

    audioPlayer.addEventListener('canplay', () => {
        isLoading = false;
        statusText.classList.remove('error');
        if (!isPlaying) {
            statusText.textContent = hasAttemptedPlay
                ? 'Listo. Reanudando...'
                : 'Listo. Haz clic en Play.';
        }
        updateButtonState();
    });

    updateButtonState();
});