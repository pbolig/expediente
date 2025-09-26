# Usamos una imagen base ligera y oficial de Node.js
FROM node:18-alpine

# Creamos y establecemos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos los archivos de dependencias y las instalamos
# Usamos 'ci' para una instalación limpia y solo de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiamos el resto de los archivos de la aplicación
COPY . .

# Exponemos el puerto 3000, que es donde corre nuestro servidor
EXPOSE 3000

# El comando que se ejecutará para iniciar la aplicación
CMD [ "node", "server/server.js" ]