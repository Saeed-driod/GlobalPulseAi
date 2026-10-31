FROM python:3.10-slim

# Install system dependencies (ffmpeg for video generation, fonts, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-dejavu-core \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Run as non-root user for security and cloud compatibility
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR $HOME/app

# Install Python requirements
COPY --chown=user backend/requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy backend application code
COPY --chown=user backend/ $HOME/app/

# Cloud Run / Container Port
EXPOSE 8080

# Start FastAPI server supporting dynamic cloud $PORT
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
