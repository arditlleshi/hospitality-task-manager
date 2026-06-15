using HospitalityTaskManager.Api.Data;
using HospitalityTaskManager.Api.DTOs;
using HospitalityTaskManager.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HospitalityTaskManager.Api.Services;

/// <summary>
/// Implements task-related application logic.
/// </summary>
public sealed class TaskService(
    AppDbContext dbContext,
    ILogger<TaskService> logger) : ITaskService
{
    private readonly AppDbContext _dbContext =
        dbContext ?? throw new ArgumentNullException(nameof(dbContext));

    private readonly ILogger<TaskService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    /// Gets tasks that match the provided filter criteria.
    /// </summary>
    /// <param name="query">The optional task filters.</param>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns>The tasks that match the request.</returns>
    public async Task<IReadOnlyList<TaskDto>> GetTasksAsync(
        GetTasksQueryDto query,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var tasksQuery = _dbContext.Tasks.AsNoTracking().AsQueryable();

        if (query.Status is not null)
        {
            tasksQuery = tasksQuery.Where(task => task.Status == query.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Department))
        {
            var normalizedDepartment = TaskCatalog.NormalizeDepartment(query.Department);
            tasksQuery = tasksQuery.Where(task => task.Department == normalizedDepartment);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchTerm = $"%{query.Search.Trim()}%";
            tasksQuery = tasksQuery.Where(task =>
                EF.Functions.Like(task.Title, searchTerm) ||
                (task.Description != null && EF.Functions.Like(task.Description, searchTerm)));
        }

        var tasks = await tasksQuery
            .OrderBy(task => task.DueDate ?? DateTime.MaxValue)
            .ThenByDescending(task => task.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        _logger.LogInformation("Returned {TaskCount} tasks.", tasks.Count);

        return tasks.Select(MapToDto).ToList();
    }

    /// <summary>
    /// Gets a task by identifier.
    /// </summary>
    /// <param name="taskId">The task identifier.</param>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns>The matching task when it exists; otherwise <c>null</c>.</returns>
    public async Task<TaskDto?> GetTaskByIdAsync(int taskId, CancellationToken cancellationToken)
    {
        var task = await _dbContext.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == taskId, cancellationToken)
            .ConfigureAwait(false);

        return task is null ? null : MapToDto(task);
    }

    /// <summary>
    /// Creates a new task.
    /// </summary>
    /// <param name="request">The task creation request.</param>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns>The created task.</returns>
    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var task = new TaskItem
        {
            Title = request.Title.Trim(),
            Description = NormalizeOptionalText(request.Description),
            Department = TaskCatalog.NormalizeDepartment(request.Department),
            Status = request.Status ?? TaskItemStatus.Open,
            Priority = request.Priority ?? TaskPriority.Medium,
            DueDate = request.DueDate,
            CreatedAt = DateTime.UtcNow,
        };

        _dbContext.Tasks.Add(task);
        await _dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation("Created task {TaskId}.", task.Id);

        return MapToDto(task);
    }

    /// <summary>
    /// Updates an existing task.
    /// </summary>
    /// <param name="taskId">The task identifier.</param>
    /// <param name="request">The task update request.</param>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns>The updated task when it exists; otherwise <c>null</c>.</returns>
    public async Task<TaskDto?> UpdateTaskAsync(
        int taskId,
        UpdateTaskDto request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var task = await _dbContext.Tasks
            .FirstOrDefaultAsync(item => item.Id == taskId, cancellationToken)
            .ConfigureAwait(false);

        if (task is null)
        {
            return null;
        }

        task.Title = request.Title.Trim();
        task.Description = NormalizeOptionalText(request.Description);
        task.Department = TaskCatalog.NormalizeDepartment(request.Department);
        task.Status = request.Status ?? task.Status;
        task.Priority = request.Priority ?? task.Priority;
        task.DueDate = request.DueDate;
        task.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation("Updated task {TaskId}.", task.Id);

        return MapToDto(task);
    }

    /// <summary>
    /// Deletes an existing task.
    /// </summary>
    /// <param name="taskId">The task identifier.</param>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns><c>true</c> when the task was deleted; otherwise <c>false</c>.</returns>
    public async Task<bool> DeleteTaskAsync(int taskId, CancellationToken cancellationToken)
    {
        var task = await _dbContext.Tasks
            .FirstOrDefaultAsync(item => item.Id == taskId, cancellationToken)
            .ConfigureAwait(false);

        if (task is null)
        {
            return false;
        }

        _dbContext.Tasks.Remove(task);
        await _dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation("Deleted task {TaskId}.", taskId);

        return true;
    }

    private static TaskDto MapToDto(TaskItem task) =>
        new()
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Department = task.Department,
            Status = task.Status,
            Priority = task.Priority,
            DueDate = task.DueDate,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
        };

    private static string? NormalizeOptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
