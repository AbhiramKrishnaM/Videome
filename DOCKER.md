# Docker Setup for VideoMe

This document outlines how to use Docker to run the VideoMe application locally for both development and production-like environments.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine
- Git repository cloned locally

## Environment Variables

Create a `.env` file in the root directory with the following variables (or adjust as needed):

```
# MongoDB
MONGO_USER=root
MONGO_PASSWORD=password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```

## Development Environment

The development environment uses hot-reloading to make development easier.

### Starting the Development Environment

```bash
docker-compose -f docker-compose.dev.yml up
```

This will start:
- MongoDB on port 27017
- Backend server on port 5000 with hot-reloading
- Frontend client on port 3000 with hot-reloading

### Stopping the Development Environment

```bash
docker-compose -f docker-compose.dev.yml down
```

### Rebuilding Containers

If you make changes to package.json or other dependencies:

```bash
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

## Production-like Environment

The production-like environment optimizes the application for performance.

### Starting the Production-like Environment

```bash
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Backend server on port 5000 (optimized build)
- Frontend client on port 3000 (optimized build served via Nginx)

### Stopping the Production-like Environment

```bash
docker-compose down
```

## Accessing the Application

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- MongoDB: mongodb://localhost:27017

## Container Management

### Viewing Logs

```bash
# View logs for all containers
docker-compose logs

# View logs for a specific service
docker-compose logs client
docker-compose logs server
docker-compose logs mongodb

# Follow logs in real-time
docker-compose logs -f
```

### Accessing a Container Shell

```bash
# Access the client container
docker-compose exec client sh

# Access the server container
docker-compose exec server sh

# Access the MongoDB container
docker-compose exec mongodb bash
```

## Data Persistence

MongoDB data is persisted in a Docker volume. To remove the volume and start fresh:

```bash
docker-compose down -v
```

## Troubleshooting

If you encounter issues:

1. Check if all containers are running:
   ```bash
   docker-compose ps
   ```

2. Check container logs for errors:
   ```bash
   docker-compose logs
   ```

3. Try rebuilding the containers:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. If MongoDB connection issues occur, ensure the connection string in the environment variables matches the MongoDB container setup. 