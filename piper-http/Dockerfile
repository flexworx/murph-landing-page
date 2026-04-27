# Piper HTTP wrapper — exposes POST /api/tts?voice=<voice> HTTP endpoint
# Wraps the piper binary (installed from pip) with a FastAPI server
# Compatible with the Thynx TTS client (callPiperTTS)
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install piper-tts and FastAPI
RUN pip install --no-cache-dir piper-tts fastapi uvicorn[standard]

WORKDIR /app
COPY server.py .

# Voice data directory
RUN mkdir -p /data/voices

EXPOSE 8880

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8880"]
