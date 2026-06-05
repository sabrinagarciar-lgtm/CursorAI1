FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn
COPY . .
ENV FLASK_APP=run.py
EXPOSE 5060
CMD ["gunicorn", "--bind", "0.0.0.0:5060", "run:app"]
