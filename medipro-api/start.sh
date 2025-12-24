#!/bin/sh

# Rodar migrações do banco de dados
echo "Sincronizando esquema do banco de dados..."
npx prisma db push --accept-data-loss

# Iniciar o servidor
echo "Iniciando servidor..."
npm start
