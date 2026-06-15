namespace HospitalityTaskManager.Api.Models;

/// <summary>
/// Represents an operational hospitality task stored by the application.
/// </summary>
public sealed class TaskItem
{
    /// <summary>
    /// Gets or sets the unique identifier of the task.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the short title of the task.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the optional task description.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the department responsible for the task.
    /// </summary>
    public string Department { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the current workflow status of the task.
    /// </summary>
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Open;

    /// <summary>
    /// Gets or sets the priority of the task.
    /// </summary>
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    /// <summary>
    /// Gets or sets the optional due date of the task.
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// Gets or sets the UTC timestamp when the task was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the UTC timestamp when the task was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
