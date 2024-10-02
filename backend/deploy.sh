set -a
echo "Be sure to have loaded correct NVM version : nvm use 18"
source venv/bin/activate
source .env
serverless deploy
