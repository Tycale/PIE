set -a
source .env
uvicorn main:app --host 0.0.0.0 --port 3001 --reload