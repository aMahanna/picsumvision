FROM python:3.10-slim as backend-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml ./
COPY server ./server
COPY scripts ./scripts

RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -e .

FROM node:18-slim as frontend-builder

WORKDIR /app/client

COPY client/package.json client/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY client ./
RUN yarn build

FROM python:3.10-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

COPY server ./server
COPY scripts ./scripts
COPY pyproject.toml wsgi.py ./

COPY --from=frontend-builder /app/client/build ./client/build

ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=server.server

EXPOSE 8000

CMD ["sh", "-c", "gunicorn wsgi:app --bind 0.0.0.0:${PORT:-8000} --workers=2"]
