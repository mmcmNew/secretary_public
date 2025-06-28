#!/bin/bash
set -e

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r server/requirements.txt

# Run the Flask application
python server/run.py
