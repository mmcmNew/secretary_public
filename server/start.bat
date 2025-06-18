@echo echo_on
call .\.venv312\Scripts\activate
set FLASK_APP=run.py
set FLASK_ENV=development
echo Starting the Flask application...
flask run --host=0.0.0.0 --port=5050
echo Flask application has stopped.
pause
