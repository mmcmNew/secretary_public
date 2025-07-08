@echo echo_on
call .\.venv312\Scripts\activate
echo Starting the Flask application...
python run.py --mode development
echo Flask application has stopped.
pause
