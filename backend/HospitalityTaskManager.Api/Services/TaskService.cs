using HospitalityTaskManager.Api.Data;
using HospitalityTaskManager.Api.DTOs;
using HospitalityTaskManager.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HospitalityTaskManager.Api.Services;

public sealed class TaskService(
    AppDbContext dbContext,
    ILogger<TaskService> logger) : ITaskService
{
    private readonly AppDbContext _dbContext =
        dbContext ?? throw new ArgumentNullException(nameof(dbContext));

    private readonly ILogger<TaskService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<IReadOnlyList<TaskDto>> GetTasksAsync(
        GetTasksQueryDto query,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var tasksQuery = BuildFilteredTasksQuery(query);

        var tasks = await tasksQuery
            .OrderBy(task => task.DueDate ?? DateTime.MaxValue)
            .ThenByDescending(task => task.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        _logger.LogInformation("Returned {TaskCount} tasks.", tasks.Count);

        return tasks.Select(MapToDto).ToList();
    }

    public async Task<TaskSummaryDto> GetTaskSummaryAsync(
        GetTasksQueryDto query,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var tasksQuery = BuildFilteredTasksQuery(query);

        var summary = await tasksQuery
            .GroupBy(_ => 1)
            .Select(group => new TaskSummaryDto
            {
                TotalTasks = group.Count(),
                OpenTasks = group.Count(task => task.Status == TaskItemStatus.Open),
                InProgressTasks = group.Count(task => task.Status == TaskItemStatus.InProgress),
                CompletedTasks = group.Count(task => task.Status == TaskItemStatus.Done),
            })
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        return summary ?? new TaskSummaryDto
        {
            TotalTasks = 0,
            OpenTasks = 0,
            InProgressTasks = 0,
            CompletedTasks = 0,
        };
    }

    public async Task<TaskDto?> GetTaskByIdAsync(int taskId, CancellationToken cancellationToken)
    {
        var task = await _dbContext.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == taskId, cancellationToken)
            .ConfigureAwait(false);

        return task is null ? null : MapToDto(task);
    }

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

    private IQueryable<TaskItem> BuildFilteredTasksQuery(GetTasksQueryDto query)
    {
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

        return tasksQuery;
    }
}
