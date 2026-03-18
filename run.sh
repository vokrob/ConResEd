#!/bin/bash

echo "Запуск ConResEd"
echo ""

cd "$(dirname "$0")/backend"

echo "Активация виртуального окружения"
source venv/bin/activate

echo "Запуск Backend сервера на http://localhost:5000"
python3 app.py