namespace HospitalityTaskManager.Api.DTOs;

/// <summary>
/// Represents the task summary counts shown on the task board.
/// </summary>
public sealed class TaskSummaryDto
{
    /// <summary>
    /// Gets the total number of tasks in the current result set.
    /// </summary>
    public required int TotalTasks { get; init; }

    /// <summary>
    /// Gets the number of open tasks in the current result set.
    /// </summary>
    public required int OpenTasks { get; init; }

    /// <summary>
    /// Gets the number of tasks in progress in the current result set.
    /// </summary>
    public required int InProgressTasks { get; init; }

    /// <summary>
    /// Gets the number of completed tasks in the current result set.
    /// </summary>
    public required int CompletedTasks { get; init; }
}
