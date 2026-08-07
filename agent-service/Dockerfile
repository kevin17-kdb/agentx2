# Zero-dependency agent service: stdlib http.server wrapping backend/ (LangGraph + RAG).
# Requires the whole repo in the build context (api.py imports backend.*).
FROM python:3.14-slim

WORKDIR /app
COPY . /app

ENV PYTHONIOENCODING=utf-8
RUN pip install --no-cache-dir -r backend/requirements.txt

EXPOSE 8100

CMD ["python", "agent-service/api.py"]
