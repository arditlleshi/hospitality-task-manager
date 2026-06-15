using HospitalityTaskManager.Api.Models;

namespace HospitalityTaskManager.Api.DTOs;

/// <summary>
/// Represents a task returned by the API.
/// </summary>
public sealed class TaskDto
{
    /// <summary>
    /// Gets the task identifier.
    /// </summary>
    public required int Id { get; init; }

    /// <summary>
    /// Gets the task title.
    /// </summary>
    public required string Title { get; init; }

    /// <summary>
    /// Gets the optional task description.
    /// </summary>
    public string? Description { get; init; }

    /// <summary>
    /// Gets the department responsible for the task.
    /// </summary>
    public required string Department { get; init; }

    /// <summary>
    /// Gets the current task status.
    /// </summary>
    public required TaskItemStatus Status { get; init; }

    /// <summary>
    /// Gets the task priority.
    /// </summary>
    public required TaskPriority Priority { get; init; }

    /// <summary>
    /// Gets the optional due date.
    /// </summary>
    public DateTime? DueDate { get; init; }

    /// <summary>
    /// Gets the UTC time when the task was created.
    /// </summary>
    public required DateTime CreatedAt { get; init; }

    /// <summary>
    /// Gets the UTC time when the task was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; init; }
}
