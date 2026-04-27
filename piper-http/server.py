"""Piper TTS HTTP wrapper.

Exposes POST /api/tts?voice=<voice_id> with text/plain body.
Returns audio/wav (or audio/mpeg if ffmpeg is available).

Compatible with Thynx callPiperTTS() which calls:
  POST /api/tts?voice=en_US-lessac-medium
  Content-Type: text/plain
  Body: <text to synthesize>
"""

import io
import logging
import os
import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import Response as FastAPIResponse

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Piper TTS HTTP Server", version="1.0.0")

VOICES_DIR = Path(os.environ.get("VOICES_DIR", "/data/voices"))
VOICES_DIR.mkdir(parents=True, exist_ok=True)

# Default voice to use if requested voice is not found
DEFAULT_VOICE = "en_US-lessac-medium"

# Map of voice_id -> (model_url, config_url)
VOICE_URLS = {
    "en_US-lessac-medium": (
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
    ),
    "en_US-amy-medium": (
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx",
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json",
    ),
    "en_US-ryan-high": (
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx",
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx.json",
    ),
    "en_US-joe-medium": (
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium.onnx",
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium.onnx.json",
    ),
    "en_GB-alan-medium": (
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx",
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx.json",
    ),
    "en_US-kusal-medium": (
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kusal/medium/en_US-kusal-medium.onnx",
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kusal/medium/en_US-kusal-medium.onnx.json",
    ),
}


def _ensure_voice(voice_id: str) -> Path:
    """Download voice model if not already cached. Returns path to .onnx file."""
    if voice_id not in VOICE_URLS:
        logger.warning(f"Voice {voice_id!r} not in registry, using default")
        voice_id = DEFAULT_VOICE

    model_path = VOICES_DIR / f"{voice_id}.onnx"
    config_path = VOICES_DIR / f"{voice_id}.onnx.json"

    if model_path.exists() and config_path.exists():
        return model_path

    model_url, config_url = VOICE_URLS[voice_id]
    logger.info(f"Downloading voice model: {voice_id}")

    import urllib.request
    urllib.request.urlretrieve(model_url, model_path)
    urllib.request.urlretrieve(config_url, config_path)
    logger.info(f"Voice model downloaded: {model_path}")

    return model_path


@app.post("/api/tts")
async def tts(
    request: Request,
    voice: str = Query(default=DEFAULT_VOICE, description="Piper voice ID"),
) -> FastAPIResponse:
    """Synthesize text to speech using Piper.

    Accepts text/plain body, returns audio/wav.
    """
    text = (await request.body()).decode("utf-8", errors="replace").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Request body (text) is required")

    try:
        model_path = _ensure_voice(voice)
    except Exception as e:
        logger.error(f"Voice download failed: {e}")
        raise HTTPException(status_code=500, detail=f"Voice download failed: {e}")

    try:
        # Run piper via subprocess: echo text | piper --model <model> --output_raw
        # Then wrap raw PCM in WAV header
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name

        result = subprocess.run(
            [
                "python3", "-m", "piper",
                "--model", str(model_path),
                "--output_file", tmp_path,
            ],
            input=text.encode("utf-8"),
            capture_output=True,
            timeout=60,
        )

        if result.returncode != 0:
            err = result.stderr.decode("utf-8", errors="replace")
            logger.error(f"Piper error: {err}")
            raise HTTPException(status_code=500, detail=f"Piper synthesis failed: {err[:200]}")

        audio_data = Path(tmp_path).read_bytes()
        Path(tmp_path).unlink(missing_ok=True)

        return FastAPIResponse(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f'attachment; filename="{voice}.wav"',
                "X-Voice": voice,
            },
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="TTS synthesis timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"TTS synthesis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "voices_dir": str(VOICES_DIR)}
