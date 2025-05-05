 // Configurar áudio para funcionar em qualquer situação
function enableAudio() {
// Tentar reproduzir todos os sons uma vez para "desbloquear" o áudio
[goodSound, badSound, gameOverSound].forEach(sound => {
    sound.muted = false;
    //Propriedade em uso 
    // sound.volume = 1.0;
    
    // Carregar o som
    sound.load();
    
    // Tentar reproduzir e pausar imediatamente
    const playPromise = sound.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            sound.pause();
            sound.currentTime = 0;
        }).catch(error => {
            // Ignorar erros esperados de autoplay bloqueado
        });
    }
});
}