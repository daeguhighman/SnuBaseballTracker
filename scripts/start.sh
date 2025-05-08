#!/bin/bash
set -e

set -a
source /etc/environment
set +a

echo "Starting deployment..."

if [[ "$DEPLOY_ENV" == "dev" ]]; then
  echo "Detected dev environment"
  bash /home/ec2-user/app/scripts/start-dev.sh
elif [[ "$DEPLOY_ENV" == "prod" ]]; then
  echo "Detected prod environment"
  bash /home/ec2-user/app/scripts/start-prod.sh
else
  echo "Unknown environment: $DEPLOY_ENV"
  exit 1
fi
