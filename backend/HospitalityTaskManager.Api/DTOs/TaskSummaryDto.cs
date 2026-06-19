namespace HospitalityTaskManager.Api.DTOs;

public sealed class TaskSummaryDto
{
    public required int TotalTasks { get; init; }

    public required int OpenTasks { get; init; }

    public required int InProgressTasks { get; init; }

    public required int CompletedTasks { get; init; }
}
