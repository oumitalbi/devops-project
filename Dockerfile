# ═══════════════════════════════════════════════════
# Inventory App — Dockerfile
# Lightweight Python image for Flask deployment
# ═══════════════════════════════════════════════════

# Use official Python slim image
FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /app

# Copy dependency file first (for Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose Flask's default port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Run the app with Gunicorn (production-ready server)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]
