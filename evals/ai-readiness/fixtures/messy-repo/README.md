# MyApp

A web application built with Express and MongoDB.

## Setup

```bash
grunt build
bower install
node server.js
```

## Architecture

This app uses a microservices architecture with the following components:
- API Gateway (port 3000)
- Auth Service (port 3001)
- User Service (port 3002)
- Notification Service (port 3003)

## Deployment

Deploy using Heroku:
```bash
heroku create
git push heroku master
```

## API Documentation

See the Swagger docs at /api-docs (requires running the API Gateway).

## Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a PR

*Last updated: March 2022*
