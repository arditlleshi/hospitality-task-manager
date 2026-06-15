using HospitalityTaskManager.Api.DTOs;

namespace HospitalityTaskManager.Api.Services;

/// <summary>
/// Manages hospitality task operations.
/// </summary>
public interface ITaskService
{
    /// <summary>
    /// Gets tasks that match the provided filter criteria.
    /// </summary>
    /// <param name="query">The optional task filters.</param>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns>The tasks that match the request.</returns>
    Task<IReadOnlyList<TaskDto>> GetTasksAsync(GetTasksQueryDto query, CancellationToken cancellationToken);

    /// <summary>
    /// Gets a task by identifier.
    /// </summary>
    /// <param name="taskId">The task identifier.</param>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns>The matching task when it exists; otherwise <c>null</c>.</returns>
    Task<TaskDto?> GetTaskByIdAsync(int taskId, CancellationToken cancellationToken);

    /// <summary>
    /// Creates a new task.
    /// </summary>
    /// <param name="request">The task creation request.</param>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns>The created task.</returns>
    Task<TaskDto> CreateTaskAsync(CreateTaskDto request, CancellationToken cancellationToken);

    /// <summary>
    /// Updates an existing task.
    /// </summary>
    /// <param name="taskId">The task identifier.</param>
    /// <param name="request">The task update request.</param>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns>The updated task when it exists; otherwise <c>null</c>.</returns>
    Task<TaskDto?> UpdateTaskAsync(int taskId, UpdateTaskDto request, CancellationToken cancellationToken);

    /// <summary>
    /// Deletes an existing task.
    /// </summary>
    /// <param name="taskId">The task identifier.</param>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns><c>true</c> when the task was deleted; otherwise <c>false</c>.</returns>
    Task<bool> DeleteTaskAsync(int taskId, CancellationToken cancellationToken);
}
