#!/bin/sh

# Rodar migrações do banco de dados
echo "Rodando migrações do Prisma..."
npx prisma migrate deploy

# Iniciar o servidor
echo "Iniciando servidor..."
npm start
