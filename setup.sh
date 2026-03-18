#!/bin/bash

echo "Настройка среды разработки ConResEd"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Проверка, установлена ​​ли база данных
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL found${NC}"

# Создать базу данных
echo -e "${YELLOW}Creating database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE conresed;" 2>/dev/null || {
    echo -e "${YELLOW}Database might already exist or cannot be created automatically${NC}"
}
echo -e "${GREEN}✓ Database setup complete${NC}"

# Установка зависимостей Python
echo -e "${YELLOW}Installing Python dependencies...${NC}"
cd backend
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}pip3 is not installed. Please install Python pip first.${NC}"
    exit 1
fi
pip3 install -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Создать .env файл
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Environment file created${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Настройка завершена!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running"
echo "2. Run the database schema: sudo -u postgres psql -d conresed -f db/schema.sql"
echo "3. Start the backend: cd backend && python3 app.py"
echo "4. Open frontend/index.html in your browser"
echo ""