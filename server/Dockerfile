FROM python:3.11-alpine AS builder

WORKDIR /install

RUN apk add --no-cache gcc musl-dev postgresql-dev

COPY requirements.txt .

RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.11-alpine

WORKDIR /app

RUN apk add --no-cache libpq

COPY --from=builder /install /usr/local

COPY . .

RUN mkdir -p uploads

EXPOSE 8000

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
