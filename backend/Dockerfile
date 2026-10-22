FROM python:3.11-slim

# Install system dependencies: ffmpeg for high-speed video rendering and fonts-dejavu-core for subtitles/captions
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user with UID 1000 (standard Hugging Face Spaces requirement)
RUN useradd -m -u 1000 user

# Set environment variables
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY --chown=user:user . /app

# Create static/videos directory with full write permissions for non-root user
RUN mkdir -p /app/static/videos && chown -R user:user /app

# Switch to non-root user
USER user

# Expose default Hugging Face Spaces port
EXPOSE 7860

# Run uvicorn on port 7860 with keep-alive timeout
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--timeout-keep-alive", "300"]
