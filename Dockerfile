# Usamos una imagen base ligera y oficial de Node.js
FROM node:18-alpine

# Establecemos el directorio de trabajo general de la aplicación
WORKDIR /usr/src/app

# Copiamos PRIMERO los archivos de dependencias del servidor a su propia carpeta
COPY server/package*.json ./server/

# Nos movemos a la carpeta del servidor para instalar las dependencias del backend
WORKDIR /usr/src/app/server
RUN npm ci --only=production

# Volvemos al directorio raíz de la aplicación para los siguientes pasos
WORKDIR /usr/src/app

# Copiamos el resto de los archivos del proyecto (frontend y backend)
COPY . .

# Exponemos el puerto 3000
EXPOSE 3000

# El comando que se ejecutará para iniciar la aplicación, apuntando al archivo correcto
CMD [ "node", "server/server.js" ]