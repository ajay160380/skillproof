import re
import logging


logger = logging.getLogger(__name__)

# Global variable to cache the Whisper model locally in memory
_whisper_model = None

def get_whisper_model():
    """Lazy load the Whisper model so it doesn't block Django startup."""
    global _whisper_model
    if _whisper_model is None:
        import whisper
        print("Loading Whisper model (base) into memory...")
        _whisper_model = whisper.load_model('base')
    return _whisper_model

def transcribe_audio(file_path: str) -> str:
    """
    Transcribes audio file using local Whisper model.
    """
    try:
        model = get_whisper_model()
        logger.info(f"Transcribing {file_path} with Whisper...")
        result = model.transcribe(file_path)
        return result.get('text', '').strip()
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        return ""

def calculate_speech_metrics(transcript: str, audio_duration_seconds: float) -> dict:
    """
    Calculates basic speech metrics: WPM, filler word count, avg sentence length.
    """
    filler_words = ["um", "uh", "like", "basically", "you know"]
    
    # Count filler words (case-insensitive)
    filler_count = 0
    transcript_lower = transcript.lower()
    for fw in filler_words:
        # use regex for exact word boundary matches for single words
        # but "you know" is two words, so basic count is fine or regex \b
        count = len(re.findall(r'\b' + re.escape(fw) + r'\b', transcript_lower))
        filler_count += count
        
    words = [w for w in transcript.split() if w.strip()]
    word_count = len(words)
    
    duration_minutes = max(audio_duration_seconds / 60.0, 0.01) # prevent div by zero
    wpm = int(word_count / duration_minutes)
    
    # Sentence length
    sentences = [s.strip() for s in re.split(r'[.!?]+', transcript) if s.strip()]
    if sentences:
        avg_sentence_length = int(word_count / len(sentences))
    else:
        avg_sentence_length = word_count
        
    return {
        "filler_word_count": filler_count,
        "words_per_minute": wpm,
        "avg_sentence_length": avg_sentence_length,
    }
