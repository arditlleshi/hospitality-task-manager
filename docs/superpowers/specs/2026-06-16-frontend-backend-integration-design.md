# Frontend and Backend Integration Design

## Goal

Refactor the Angular frontend toward the structure described in `README.MD` and connect it to the existing ASP.NET Core backend so the application uses real API-backed CRUD instead of in-memory sample data.

## Current State

### Frontend

- Angular version is `22.0.1`.
- Routing currently renders a single `Home` page at `/`.
- Task data is held only in `LocalTaskStore`, which seeds in-memory sample tasks.
- The current UI already includes a mature visual language, summary cards, filters, search, delete confirmation, and a signal-based form flow.

### Backend

- ASP.NET Core Web API already exposes task CRUD endpoints through `TasksController`.
- Entity Framework Core is configured with SQLite.
- DTO validation, enum serialization, and service-layer logic are already in place.
- Local launch settings expose the API at `https://localhost:7251` and `http://localhost:5004`.

### Integration Gap

- The frontend is not using `HttpClient` for task CRUD.
- Frontend routing does not match the README target structure.
- The Angular dev proxy targets `https://localhost:5001`, which does not match the backend launch configuration.

## Scope

### In Scope

- Replace the in-memory frontend task flow with real API integration.
- Split the single-page Angular experience into list and form routes.
- Preserve the existing UI styling and shared controls where practical.
- Fix local development connectivity between Angular and ASP.NET Core.
- Verify create, read, update, filter, and delete against the real backend.

### Out of Scope

- Authentication and authorization.
- Major backend architecture rewrites.
- New dashboard or analytics features beyond the existing summary cards.
- Large design-system refactors unrelated to task CRUD and routing.

## Recommended Approach

Use an incremental feature refactor:

1. Preserve the current visual design language and shared UI primitives.
2. Introduce dedicated task list and task form pages.
3. Replace `LocalTaskStore` with an API-backed Angular service and a small signal-based facade/store.
4. Fix the proxy target and, if needed, add development CORS support on the backend.

This approach matches the README target structure without over-expanding scope or discarding the strongest existing frontend work.

## Target Frontend Architecture

### Routes

- `/` redirects to `/tasks`
- `/tasks` renders the task list page
- `/tasks/new` renders the create-task form page
- `/tasks/:id/edit` renders the edit-task form page
- Unknown routes redirect to `/tasks`

### Feature Structure

Recommended structure:

```txt
src/app
|
+-- core
|   +-- services
|       +-- task-api.service.ts
|
+-- features
|   +-- tasks
|       +-- pages
|       |   +-- task-list
|       |   +-- task-form
|       +-- task-store.ts
|       +-- task.models.ts
|       +-- task.mappers.ts
|       +-- task.query.ts
|
+-- shared
|   +-- components
|
+-- app.routes.ts
```

The exact file naming can stay aligned to the current standalone-component approach, but the boundary should be feature-first and route-driven.

## Component Design

### TaskListPage

Responsibilities:

- Load tasks from the backend.
- Render the current board/list UI and summary cards.
- Read and write filter state through query parameters.
- Support search, status filter, and department filter.
- Trigger delete requests and refresh the list.
- Navigate to the create and edit routes.

Notes:

- The current `Home` page board layout can be reused as the basis for this page.
- Modal-based editing should be removed in favor of route navigation.

### TaskFormPage

Responsibilities:

- Handle both create and edit modes.
- Detect edit mode using the `id` route parameter.
- Load a task by id when editing.
- Reuse the existing signal-form validation approach.
- Submit `POST` on create and `PUT` on edit.
- Navigate back to `/tasks` after a successful save.

Notes:

- The current form fields, validation rules, dropdowns, and date picker should be reused where possible.
- The route-based form page replaces the current dialog workflow.

### Shared UI Components

Keep the current shared UI components and styling:

- `Dropdown`
- `DatePicker`
- `Icon`

These components already fit the existing interface quality and do not need redesign for this integration step.

## Data Layer Design

### TaskApiService

Introduce a dedicated Angular service that wraps `HttpClient` and exposes:

- `getTasks(query)`
- `getTaskById(taskId)`
- `createTask(payload)`
- `updateTask(taskId, payload)`
- `deleteTask(taskId)`

Implementation rules:

- Use `/api/tasks` as the base URL so Angular dev proxy handles local forwarding.
- Convert frontend filter state into query parameters expected by the backend.
- Keep request and response typing explicit.

### TaskStore or Facade

Introduce a small signal-based task store/facade to hold request state:

- `tasks`
- `loading`
- `error`
- `refresh()`
- `removeTask()`

Purpose:

- Keep request-state orchestration out of pages.
- Centralize reload logic after create, update, and delete.
- Preserve a signal-friendly Angular 22 experience.

This store should not recreate a large state-management framework. It should stay narrow and feature-specific.

### Model Alignment

Frontend model definitions should stay aligned to backend DTOs:

- `status` values: `Open`, `InProgress`, `Done`, `Cancelled`
- `priority` values: `Low`, `Medium`, `High`, `Urgent`
- `department` values: `Reception`, `Housekeeping`, `Kitchen`, `Maintenance`, `Management`
- Date values are consumed in the UI as ISO strings

The frontend should map API responses into UI-friendly task objects if needed, but should not invent a different domain contract.

## Data Flow

### Task List Flow

1. User opens `/tasks`.
2. List page reads query params for `status`, `department`, and `search`.
3. List page asks the task store/facade to load tasks.
4. Task store calls `TaskApiService.getTasks`.
5. API returns task data from the backend.
6. Store updates signals for `tasks`, `loading`, and `error`.
7. Page renders the list and summary cards.

### Create Flow

1. User opens `/tasks/new`.
2. Form page initializes an empty draft model.
3. User submits valid input.
4. Form page calls `TaskApiService.createTask`.
5. API returns the created task.
6. Frontend navigates back to `/tasks`.
7. Task list reloads from the backend.

### Edit Flow

1. User opens `/tasks/:id/edit`.
2. Form page loads the task by id from the API.
3. User edits and submits.
4. Form page calls `TaskApiService.updateTask`.
5. API returns the updated task.
6. Frontend navigates back to `/tasks`.
7. Task list reloads from the backend.

### Delete Flow

1. User requests deletion from the task list page.
2. Frontend shows inline confirmation.
3. On confirm, the page calls the task store/facade delete operation.
4. Store calls `TaskApiService.deleteTask`.
5. On success, the list reloads or removes the item locally.

## Error Handling and Validation

### Frontend

- Show explicit loading, empty, and error states on the task list page.
- Show a form-level error message when save fails.
- Show delete failure near the affected task row/card if deletion does not succeed.
- Keep immediate client-side validation for required fields and max lengths.

### Backend

- Keep ASP.NET Core DTO validation as the source of truth.
- `400 Bad Request` responses should be surfaced as readable validation feedback in the form.
- `404 Not Found` during edit-page load should return the user to `/tasks` with a brief message that the task no longer exists.
- `500` errors should show a generic failure message in the UI without exposing raw server details.

## Connectivity Changes

### Angular Proxy

Update `frontend/proxy.conf.json` to point at the actual backend development URL. The current proxy target is incorrect.

Recommended target:

- `https://localhost:7251`

Alternative:

- `http://localhost:5004`

Use one backend origin consistently in development.

### Backend Development Access

If the frontend continues to rely only on the Angular proxy, CORS is not strictly required for local development. If direct browser-to-API calls are used at any point, add a development CORS policy for the Angular origin.

## Backend Changes

Backend changes should stay minimal:

- Preserve the existing controller, service, DTO, and EF Core structure.
- Add only the connectivity or response-shape adjustments needed for frontend integration.
- Keep XML documentation and current validation behavior intact.

No backend rewrite is required because the existing API already satisfies the main CRUD contract.

## Verification Plan

### Build Verification

- Run `dotnet build` for the backend after any backend change.
- Run `ng build` for the frontend after Angular refactoring.

### Functional Verification

Verify the following against the real API:

1. Open `/tasks` and confirm tasks load from the backend.
2. Create a new task and confirm it persists after refresh.
3. Edit a task and confirm updated values persist.
4. Filter by status and department.
5. Search by title or description.
6. Delete a task and confirm it is removed from the database-backed list.

### Manual API Verification

Use Swagger/OpenAPI to confirm:

- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`

## Risks and Mitigations

### Risk: Proxy Misconfiguration Blocks All Frontend Requests

Mitigation:

- Fix the proxy target before wiring the frontend data layer.
- Validate connectivity with a direct task-list load early.

### Risk: Route Refactor Breaks Current UX

Mitigation:

- Reuse the existing board and form markup where possible.
- Change the interaction model from modal to route, not the underlying design language.

### Risk: Duplicate State Logic Across Pages

Mitigation:

- Centralize API request state in a small task store/facade.
- Keep page responsibilities focused on route and view concerns.

### Risk: Edit Page Fails for Missing Tasks

Mitigation:

- Handle `404` explicitly and redirect users back to the task list with a readable message.

## Implementation Sequence

1. Fix the frontend proxy target.
2. Add `HttpClient` provisioning in Angular if it is not already configured.
3. Introduce `TaskApiService`.
4. Introduce a small signal-based task store/facade.
5. Split the current page into `TaskListPage` and `TaskFormPage`.
6. Update routing to `/tasks`, `/tasks/new`, and `/tasks/:id/edit`.
7. Remove `LocalTaskStore` usage from active flows.
8. Verify CRUD and filtering against the backend.
9. Run `dotnet build` and `ng build`.

## Success Criteria

The design is complete when:

- The Angular app uses real backend data for task CRUD.
- The Angular routes match the README-style task list and task form structure.
- The current UI quality is preserved rather than replaced with a simplified redesign.
- Local development connectivity works reliably.
- Full CRUD, filtering, and search work end-to-end against the ASP.NET Core API.
