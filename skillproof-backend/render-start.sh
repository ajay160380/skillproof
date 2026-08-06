#!/usr/bin/env bash
# exit on error
set -o errexit

# Apply database migrations
python manage.py migrate --no-input

# Collect static files
python manage.py collectstatic --no-input

# Start Celery worker in the background
# We must run it this way on Render's free tier because free background workers are not available
celery -A config worker --loglevel=info --concurrency=1 --pool=solo &

# Start Gunicorn in the foreground
# Render automatically injects the PORT environment variable
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120
