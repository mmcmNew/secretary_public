FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ ./

RUN mkdir -p app/user_data logs

ENV PYTHONPATH=/app

EXPOSE 5100

CMD ["python", "manage.py", "--mode", "docker"]
