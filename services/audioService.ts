import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

class AudioService {
  private backgroundMusic: AudioPlayer | null = null;
  public isPlaying: boolean = false;

  async initializeAudio() {
    try {
      // Configure audio mode for background playback
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
        interruptionModeAndroid: 'doNotMix',
      });
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  async playBackgroundMusic() {
    try {
      // Stop any existing music first
      await this.stopBackgroundMusic();

      // Create and play the background music
      this.backgroundMusic = createAudioPlayer(
        require('../assets/audio/noir_rain.mp3')
      );

      // Set properties
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.3;
      
      // Start playing
      this.backgroundMusic.play();
      this.isPlaying = true;

      console.log('Background music started');
    } catch (error) {
      console.error('Error playing background music:', error);
    }
  }

  async stopBackgroundMusic() {
    try {
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
        this.backgroundMusic.remove();
        this.backgroundMusic = null;
        this.isPlaying = false;
        console.log('Background music stopped');
      }
    } catch (error) {
      console.error('Error stopping background music:', error);
    }
  }

  async pauseBackgroundMusic() {
    try {
      if (this.backgroundMusic && this.isPlaying) {
        this.backgroundMusic.pause();
        this.isPlaying = false;
      }
    } catch (error) {
      console.error('Error pausing background music:', error);
    }
  }

  async resumeBackgroundMusic() {
    try {
      if (this.backgroundMusic && !this.isPlaying) {
        this.backgroundMusic.play();
        this.isPlaying = true;
      }
    } catch (error) {
      console.error('Error resuming background music:', error);
    }
  }

  async setVolume(volume: number) {
    try {
      if (this.backgroundMusic) {
        // Clamp volume between 0 and 1
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.backgroundMusic.volume = clampedVolume;
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  // Clean up when component unmounts
  async cleanup() {
    await this.stopBackgroundMusic();
  }
}

export default new AudioService();