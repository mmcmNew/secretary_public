FROM python:alpine

WORKDIR /app

# RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ ./

RUN mkdir -p app/user_data logs

ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV SERVER_PORT=5100

EXPOSE 5100

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["sh", "-c", "flask db upgrade && flask seed && python run.py --mode docker"]
