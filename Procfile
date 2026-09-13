web: sh -c "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn bettyverse.wsgi:application --bind 0.0.0.0:${PORT:-8000}"
