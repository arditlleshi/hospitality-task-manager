# Hospitality Task Manager

Hospitality Task Manager is a full-stack task tracking app for operational teams in hotels, restaurants, and similar hospitality environments. It provides a clean dashboard for managing work items, reviewing task status, and keeping day-to-day operations organized.

## Overview

The app includes:

- A task board with summary cards
- Search and filtering by status and department
- Full task details in an expandable view
- Create, edit, and delete workflows
- A modal task editor with date and time selection
- A backend API backed by SQLite

## Features

- View a list of hospitality tasks
- Search tasks by title or notes
- Filter tasks by status and department
- See summary counts for total, open, in-progress, and completed tasks
- Create new tasks
- Edit existing tasks
- Delete tasks with confirmation
- Set due dates and times
- Track task metadata such as department, priority, and timestamps

## Tech Stack

### Frontend

- Angular 22
- TypeScript
- SCSS
- Reactive forms
- Angular Router

### Backend

- ASP.NET Core Web API
- .NET 10
- Entity Framework Core
- SQLite
- OpenAPI / Swagger UI

## Project Structure

```txt
backend/
  HospitalityTaskManager.Api/
    Controllers/
    Data/
    DTOs/
    Migrations/
    Models/
    Services/

frontend/
  src/app/
    core/
    features/tasks/
    shared/
```

## Getting Started

### Prerequisites

- .NET 10 SDK
- Node.js 20 or later
- npm

### Backend

From the repository root:

```bash
dotnet run --project backend/HospitalityTaskManager.Api/HospitalityTaskManager.Api.csproj
```

The API uses the connection string in `backend/HospitalityTaskManager.Api/appsettings.json` and stores the SQLite database in `backend/HospitalityTaskManager.Api/Data/`.

### Frontend

```bash
cd frontend
npm install
npm start
```

The Angular app runs on the default development server and connects to the API through the local proxy configuration.

## API

The backend exposes task endpoints under `/api/tasks`, including:

- `GET /api/tasks`
- `GET /api/tasks/summary`
- `GET /api/tasks/{taskId}`
- `POST /api/tasks`
- `PUT /api/tasks/{taskId}`
- `DELETE /api/tasks/{taskId}`

In development, OpenAPI / Swagger UI is available from the backend app.

## Task Fields

Supported departments:

- Reception
- Housekeeping
- Kitchen
- Maintenance
- Management

Supported statuses:

- Open
- InProgress
- Done
- Cancelled

Supported priorities:

- Low
- Medium
- High
- Urgent

## Notes

- The frontend and backend are kept in separate folders so they can be developed independently.
- The backend uses EF Core migrations for schema changes.
- The task editor uses a custom date and time picker UI to keep the design consistent across the app.

