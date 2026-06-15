# Hospitality Task Manager — Angular + ASP.NET Core Practice App

## 1. Main Purpose

The purpose of this app is to quickly refresh and practice the stack used in the Alacer Software Developer role:

- Angular frontend
- ASP.NET Core Web API backend
- C#
- REST APIs
- Entity Framework Core
- SQL database concepts
- Clean code
- Layered architecture
- Dependency Injection
- DTOs
- Basic validation
- Testing mindset

This should be a small, focused, realistic practice app that can be built in 1–2 days and discussed confidently in an interview.

The goal is not to build a large portfolio project. The goal is to show that the structure of a modern .NET + Angular application is understood and that existing Java/Spring Boot backend knowledge can transfer well to C#/.NET.

---

## 2. App Idea

### App Name

**Hospitality Task Manager**

### Short Description

A simple internal task management app for a hotel, restaurant, or hospitality business. Staff members can create, view, update, filter, and delete operational tasks.

Example use cases:

- Reception creates a task for housekeeping.
- Restaurant manager creates a task for the kitchen team.
- Maintenance receives a repair task for a hotel room.
- A manager tracks which tasks are open, in progress, or completed.

This idea fits well because Alacer builds software for the hospitality sector.

---

## 3. Why This App Is Useful for Interview Preparation

This app helps practice the exact concepts likely to come up in the second interview:

- How Angular communicates with a REST API.
- How ASP.NET Core structures backend endpoints.
- How controllers, services, DTOs, entities, and DbContext work together.
- How EF Core maps C# objects to database tables.
- How to keep business logic away from controllers.
- How to structure code for maintainability.
- How Java/Spring Boot concepts map to C#/.NET.

A good interview sentence:

> To prepare for this interview, I built a small Angular and ASP.NET Core Web API app. It helped me refresh controllers, services, DTOs, EF Core, dependency injection, REST endpoints, Angular HttpClient, reactive forms, and clean project structure.

---

## 4. Core Features

Keep the app small and complete.

### Required Features

1. **View all tasks**
   - Display a table/list of hospitality tasks.
   - Show title, department, status, priority, due date, and created date.

2. **Create a new task**
   - User fills in a form.
   - Angular sends a POST request to the API.
   - Backend validates and saves the task.

3. **Edit an existing task**
   - User can update title, description, department, status, priority, and due date.
   - Angular sends a PUT request.
   - Backend updates the database record.

4. **Delete a task**
   - User can delete a task.
   - Angular sends a DELETE request.
   - Backend removes the task from the database.

5. **Filter by status**
   - User can filter tasks by:
     - All
     - Open
     - In Progress
     - Done
     - Cancelled

6. **Basic validation**
   - Title is required.
   - Department is required.
   - Status is required.
   - Priority is required.

---

## 5. Optional Features

Only add these if the core app is finished.

1. **Search by title**
   - Search tasks by title or description.

2. **Filter by department**
   - Reception
   - Housekeeping
   - Kitchen
   - Maintenance
   - Management

3. **Basic dashboard cards**
   - Total tasks
   - Open tasks
   - In progress tasks
   - Completed tasks

4. **Unit test for service logic**
   - Add one or two simple XUnit tests.

5. **Swagger API documentation**
   - ASP.NET Core includes Swagger easily.
   - Use it to test API endpoints before connecting Angular.

---

## 6. Recommended Stack

### Frontend

- Angular
- TypeScript
- HTML
- CSS/SCSS
- Bootstrap
- Angular Reactive Forms
- Angular HttpClient
- RxJS / Observables
- Angular Routing

### Backend

- C#
- ASP.NET Core Web API
- Entity Framework Core
- SQLite for quick local development
- Optional later: SQL Server / MSSQL
- Swagger / OpenAPI
- Dependency Injection
- DTOs
- Service layer
- Controller layer

### Testing

- XUnit for backend tests
- Manual API testing through Swagger
- Browser testing through Angular UI

### Tools

- Visual Studio or Visual Studio Code
- .NET CLI
- Angular CLI
- Git
- Swagger UI
- SQLite browser, optional

---

## 7. Database Choice

### Recommended for this practice app

Use **SQLite** because it is faster to set up and does not require SQL Server installation.

In the interview, say:

> For this small practice project, I used SQLite to move faster, but the same EF Core structure can work with SQL Server by changing the provider and connection string.

### Why this is acceptable

The important part is not the database engine. The important part is understanding:

- Entities
- DbContext
- Migrations
- CRUD operations
- SQL concepts
- EF Core mapping
- Data access flow

---

## 8. Main Entity

Use only one main entity to keep the app focused.

### TaskItem

```csharp
public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Status { get; set; } = "Open";
    public string Priority { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

---

## 9. Departments

Use a simple list of departments:

```txt
Reception
Housekeeping
Kitchen
Maintenance
Management
```

---

## 10. Status Values

Use simple status values:

```txt
Open
InProgress
Done
Cancelled
```

Optional C# enum:

```csharp
public enum TaskStatus
{
    Open,
    InProgress,
    Done,
    Cancelled
}
```

For speed, strings are fine. Enums are cleaner if there is enough time.

---

## 11. Priority Values

Use simple priority values:

```txt
Low
Medium
High
Urgent
```

Optional C# enum:

```csharp
public enum TaskPriority
{
    Low,
    Medium,
    High,
    Urgent
}
```

---

## 12. Backend Architecture

### Simple Layered Architecture

The backend should use a clean but simple layered structure:

```txt
Angular UI
   ↓
ASP.NET Core Controller
   ↓
Service Layer
   ↓
EF Core DbContext
   ↓
SQLite / SQL Server Database
```

### Responsibility of Each Layer

#### Controller

The controller handles HTTP requests and responses.

It should:

- Receive requests from Angular.
- Validate route parameters.
- Call the service layer.
- Return proper HTTP status codes.

It should not contain heavy business logic.

#### Service

The service contains application logic.

It should:

- Handle create, update, delete, and query logic.
- Apply simple business rules.
- Map entities to DTOs.
- Keep controller code clean.

#### DbContext

The DbContext handles database access through EF Core.

It should:

- Expose DbSet properties.
- Track entity changes.
- Save changes to the database.

#### DTOs

DTOs control the shape of data entering and leaving the API.

They help avoid exposing database entities directly to the frontend.

---

## 13. Backend Folder Structure

Recommended backend structure:

```txt
HospitalityTaskManager.Api
│
├── Controllers
│   └── TasksController.cs
│
├── Data
│   └── AppDbContext.cs
│
├── DTOs
│   ├── TaskDto.cs
│   ├── CreateTaskDto.cs
│   └── UpdateTaskDto.cs
│
├── Models
│   └── TaskItem.cs
│
├── Services
│   ├── ITaskService.cs
│   └── TaskService.cs
│
├── Migrations
│
├── Program.cs
├── appsettings.json
└── HospitalityTaskManager.Api.csproj
```

This is simple enough for a small project but still shows good structure.

---

## 14. Backend Request Flow

Example: creating a task.

```txt
Angular form submit
   ↓
POST /api/tasks
   ↓
TasksController.Create()
   ↓
TaskService.CreateAsync()
   ↓
AppDbContext.Tasks.Add()
   ↓
SaveChangesAsync()
   ↓
Return TaskDto to Angular
```

Interview explanation:

> The controller receives the HTTP request and passes the DTO to the service. The service handles the application logic and uses EF Core through the DbContext to save the task. Then it returns a response DTO back to the controller.

---

## 15. REST API Endpoints

### Get all tasks

```txt
GET /api/tasks
```

Optional query params:

```txt
GET /api/tasks?status=Open
GET /api/tasks?department=Housekeeping
GET /api/tasks?search=room
```

### Get task by id

```txt
GET /api/tasks/{id}
```

### Create task

```txt
POST /api/tasks
```

Request body:

```json
{
  "title": "Clean room 204",
  "description": "Guest checkout completed. Room needs cleaning.",
  "department": "Housekeeping",
  "status": "Open",
  "priority": "High",
  "dueDate": "2026-06-17T12:00:00"
}
```

### Update task

```txt
PUT /api/tasks/{id}
```

Request body:

```json
{
  "title": "Clean room 204",
  "description": "Room cleaned and checked.",
  "department": "Housekeeping",
  "status": "Done",
  "priority": "High",
  "dueDate": "2026-06-17T12:00:00"
}
```

### Delete task

```txt
DELETE /api/tasks/{id}
```

---

## 16. HTTP Status Codes

Use proper status codes:

```txt
200 OK              Successful GET or PUT
201 Created         Successful POST
204 No Content      Successful DELETE
400 Bad Request     Invalid input
404 Not Found       Task not found
500 Server Error    Unexpected server issue
```

Interview sentence:

> I try to keep REST APIs clear by using resource-based routes, correct HTTP methods, request/response DTOs, and proper status codes.

---

## 17. Backend DTOs

### TaskDto

Used for responses.

```csharp
public class TaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

### CreateTaskDto

Used for create requests.

```csharp
public class CreateTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Status { get; set; } = "Open";
    public string Priority { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
}
```

### UpdateTaskDto

Used for update requests.

```csharp
public class UpdateTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
}
```

---

## 18. Validation Rules

Keep validation basic:

### Required Fields

- Title
- Department
- Status
- Priority

### Optional Fields

- Description
- DueDate

### Example Validation Rules

```txt
Title cannot be empty.
Title should be max 150 characters.
Department must be selected.
Status must be valid.
Priority must be valid.
Due date can be empty.
```

Use simple data annotations if needed:

```csharp
public class CreateTaskDto
{
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public string Department { get; set; } = string.Empty;

    [Required]
    public string Status { get; set; } = "Open";

    [Required]
    public string Priority { get; set; } = "Medium";

    public DateTime? DueDate { get; set; }
}
```

---

## 19. Entity Framework Core Setup

### AppDbContext

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<TaskItem> Tasks => Set<TaskItem>();
}
```

### Register DbContext

For SQLite:

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
```

For SQL Server:

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

### Example connection string for SQLite

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=hospitality_tasks.db"
  }
}
```

---

## 20. Dependency Injection

Register services in `Program.cs`:

```csharp
builder.Services.AddScoped<ITaskService, TaskService>();
```

Then inject the service into the controller:

```csharp
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }
}
```

Interview sentence:

> Dependency Injection helps keep classes loosely coupled and easier to test because controllers depend on interfaces instead of creating services directly.

---

## 21. Program.cs Responsibilities

`Program.cs` configures the application.

It usually includes:

- Controllers
- Swagger
- Database
- Dependency Injection
- CORS
- Middleware
- Routing

Example responsibilities:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ITaskService, TaskService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.UseAuthorization();
app.MapControllers();
app.Run();
```

---

## 22. CORS

Because Angular runs on `http://localhost:4200` and the .NET API runs on another port, CORS is needed.

Example:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

Then:

```csharp
app.UseCors("AllowAngular");
```

Interview sentence:

> CORS is needed when the frontend and backend run on different origins, for example Angular on port 4200 and the API on another local port.

---

## 23. Frontend Architecture

Angular should be structured by feature.

Recommended structure:

```txt
src/app
│
├── core
│   └── services
│       └── task.service.ts
│
├── features
│   └── tasks
│       ├── components
│       │   ├── task-list
│       │   │   ├── task-list.component.ts
│       │   │   ├── task-list.component.html
│       │   │   └── task-list.component.scss
│       │   │
│       │   └── task-form
│       │       ├── task-form.component.ts
│       │       ├── task-form.component.html
│       │       └── task-form.component.scss
│       │
│       └── models
│           └── task.model.ts
│
├── app.component.ts
├── app.component.html
├── app.routes.ts
└── app.config.ts
```

If you want it even simpler:

```txt
src/app
│
├── tasks
│   ├── task-list
│   ├── task-form
│   └── task.model.ts
│
├── services
│   └── task.service.ts
│
└── app.routes.ts
```

Both are fine. For two days, choose the simpler one.

---

## 24. Angular Components

### TaskListComponent

Responsibilities:

- Load tasks from API.
- Display tasks in a table.
- Filter tasks by status.
- Delete a task.
- Navigate to create/edit form.

### TaskFormComponent

Responsibilities:

- Create new task.
- Edit existing task.
- Use Angular Reactive Forms.
- Validate required fields.
- Submit data to API.

---

## 25. Angular Service

Use Angular `HttpClient` inside a service.

```typescript
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'https://localhost:5001/api/tasks';

  constructor(private http: HttpClient) {}

  getTasks(status?: string): Observable<TaskItem[]> {
    const params = status && status !== 'All' ? { status } : {};
    return this.http.get<TaskItem[]>(this.apiUrl, { params });
  }

  getTaskById(id: number): Observable<TaskItem> {
    return this.http.get<TaskItem>(`${this.apiUrl}/${id}`);
  }

  createTask(payload: CreateTaskPayload): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.apiUrl, payload);
  }

  updateTask(id: number, payload: UpdateTaskPayload): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.apiUrl}/${id}`, payload);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

Interview sentence:

> In Angular, I prefer keeping API calls inside services so components stay cleaner and focus mostly on UI logic.

---

## 26. Angular Model

```typescript
export interface TaskItem {
  id: number;
  title: string;
  description?: string;
  department: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TaskStatus = 'Open' | 'InProgress' | 'Done' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  department: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskPayload extends CreateTaskPayload {}
```

---

## 27. Angular Reactive Form

Use Reactive Forms because they are better for business forms.

```typescript
form = this.fb.group({
  title: ['', Validators.required],
  description: [''],
  department: ['', Validators.required],
  status: ['Open', Validators.required],
  priority: ['Medium', Validators.required],
  dueDate: ['']
});
```

Interview sentence:

> I prefer reactive forms for business applications because they are structured, easier to validate, and easier to maintain for larger forms.

---

## 28. UI Layout

Use Bootstrap for quick styling because the Alacer job mentions Bootstrap.

### Pages

```txt
/tasks              Task list
/tasks/new          Create task
/tasks/:id/edit     Edit task
```

### Task List UI

Display:

- Page title
- Create button
- Status filter dropdown
- Table with tasks
- Edit button
- Delete button

Columns:

```txt
Title
Department
Status
Priority
Due Date
Created At
Actions
```

### Task Form UI

Fields:

```txt
Title
Description
Department
Status
Priority
Due Date
Save button
Cancel button
```

---

## 29. Routing

Example Angular routes:

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  { path: 'tasks', component: TaskListComponent },
  { path: 'tasks/new', component: TaskFormComponent },
  { path: 'tasks/:id/edit', component: TaskFormComponent }
];
```

---

## 30. Error Handling

Keep error handling simple.

### Backend

Return:

- `NotFound()` if task does not exist.
- `BadRequest()` if input is invalid.
- `Ok()` for successful reads and updates.
- `CreatedAtAction()` for create.
- `NoContent()` for delete.

### Frontend

Show simple messages:

```txt
Could not load tasks.
Task saved successfully.
Task deleted successfully.
Please fill in all required fields.
```

---

## 31. Testing Scope

Do not spend too much time testing, but understand the idea.

### Manual Testing

Test API with Swagger:

- GET all tasks
- POST create task
- PUT update task
- DELETE task
- GET by id

Test frontend:

- Form validation
- Task creation
- Task update
- Task delete
- Filter by status

### Optional XUnit Test

Add one simple test for service logic.

Example test idea:

```txt
CreateTaskAsync should create a task with CreatedAt set.
```

Use Arrange / Act / Assert:

```txt
Arrange: prepare input DTO and fake/in-memory database
Act: call service method
Assert: check returned result
```

Interview sentence:

> I understand the Arrange, Act, Assert structure. For a small app like this, I would test the service layer because that is where the business logic should live.

---

## 32. Development Steps

### Step 1: Create Backend

```bash
dotnet new webapi -n HospitalityTaskManager.Api
```

### Step 2: Add EF Core Packages

For SQLite:

```bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
```

For SQL Server later:

```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
```

### Step 3: Create Backend Folders

Create:

```txt
Controllers
Data
DTOs
Models
Services
```

### Step 4: Create Entity and DbContext

Create:

```txt
Models/TaskItem.cs
Data/AppDbContext.cs
```

### Step 5: Register DbContext and Services

Update:

```txt
Program.cs
appsettings.json
```

### Step 6: Add Migration

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Step 7: Create Service Layer

Create:

```txt
Services/ITaskService.cs
Services/TaskService.cs
```

### Step 8: Create Controller

Create:

```txt
Controllers/TasksController.cs
```

### Step 9: Test Backend in Swagger

Run:

```bash
dotnet run
```

Open Swagger and test endpoints.

### Step 10: Create Angular App

```bash
ng new hospitality-task-manager-client --routing --style=scss
```

### Step 11: Add Bootstrap

```bash
npm install bootstrap
```

Add Bootstrap in `angular.json` or `styles.scss`.

### Step 12: Create Angular Service and Components

```bash
ng generate service services/task
ng generate component tasks/task-list
ng generate component tasks/task-form
```

### Step 13: Connect Angular to API

Use `HttpClient` in `TaskService`.

### Step 14: Build Forms and UI

Use Reactive Forms and Bootstrap.

### Step 15: Final Test

Test full flow:

```txt
Create task → View task → Edit task → Filter task → Delete task
```

---

## 33. What Not to Build

Avoid features that waste time:

- Authentication
- User roles
- Real hotel booking system
- Payments
- Complex dashboard
- Advanced state management
- Deployment
- Email notifications
- File uploads
- Multi-tenant logic

Keep it small and focused.

---

## 34. What to Be Able to Explain in the Interview

### Explain the app in 30 seconds

> I built a small Hospitality Task Manager to refresh Angular and ASP.NET Core Web API. The app allows users to create, update, delete, view, and filter operational tasks for hotel or restaurant departments. The frontend is Angular with HttpClient and reactive forms. The backend is ASP.NET Core Web API with controllers, services, DTOs, EF Core, and SQLite. I kept the architecture simple and layered so the controller handles HTTP, the service handles application logic, and EF Core handles database access.

### Explain the backend structure

> The backend has controllers, DTOs, services, models, and DbContext. The controller receives requests from Angular, the service handles the business logic, and EF Core stores data in the database. I used dependency injection to connect the controller with the service.

### Explain the frontend structure

> The Angular frontend has a task list component, a task form component, a task model, and a task service. The service handles HTTP calls, while components handle UI and form behavior.

### Explain why DTOs are used

> DTOs help keep the API contract separate from the database entity. They also control what data is accepted from the frontend and what data is returned.

### Explain why services are used

> Services keep business logic away from controllers. This makes controllers smaller and makes the logic easier to test and maintain.

### Explain Java/Spring to .NET transfer

> My backend experience is mainly with Java/Spring Boot, but the structure is similar: controllers, services, entities, DTOs, dependency injection, REST APIs, and database access. In .NET, EF Core maps to the role Spring Data JPA plays in Java.

---

## 35. Java/Spring Boot to .NET Comparison

```txt
Java / Spring Boot              C# / ASP.NET Core
--------------------------------------------------
Controller                      Controller
Service                         Service
Repository                      Repository / DbContext
Entity                          Entity / Model
DTO                             DTO
Spring Data JPA                 Entity Framework Core
application.properties          appsettings.json
Maven / Gradle                  NuGet / dotnet CLI
JUnit                           XUnit
Spring Dependency Injection     ASP.NET Core Dependency Injection
Spring Security                 ASP.NET Core Authentication / Authorization
```

Interview sentence:

> The syntax and ecosystem are different, but the architecture feels familiar because both stacks use controllers, services, dependency injection, DTOs, REST APIs, and database mapping.

---

## 36. Final Scope Checklist

Before the interview, the app should have:

```txt
Backend
[ ] ASP.NET Core Web API created
[ ] TaskItem entity created
[ ] AppDbContext created
[ ] EF Core configured
[ ] SQLite database working
[ ] Migration created
[ ] TasksController created
[ ] TaskService created
[ ] DTOs created
[ ] Swagger working
[ ] GET /api/tasks working
[ ] POST /api/tasks working
[ ] PUT /api/tasks/{id} working
[ ] DELETE /api/tasks/{id} working

Frontend
[ ] Angular app created
[ ] Bootstrap added
[ ] Task model created
[ ] TaskService with HttpClient created
[ ] TaskListComponent created
[ ] TaskFormComponent created
[ ] Reactive form working
[ ] Create task working
[ ] Edit task working
[ ] Delete task working
[ ] Status filter working
```

---

## 37. Best Final Interview Positioning

Use this positioning:

> I wanted to be honest that my professional backend experience is more Java/Spring Boot than .NET. But because the backend architecture concepts are similar, I built this small app to refresh the Microsoft stack. It helped me connect my existing experience with controllers, services, REST APIs, DTOs, SQL concepts, and object-oriented programming to ASP.NET Core, EF Core, and Angular.

This sounds honest, motivated, and practical.

---

## 38. Recommended Final App Scope

The best final version should include:

- One backend project
- One Angular frontend project
- One main entity: TaskItem
- Full CRUD
- Status filtering
- Reactive form validation
- Bootstrap UI
- Swagger API testing
- Clean structure

This is enough.

A small complete app is better than a large unfinished app.
