using HospitalityTaskManager.Api.Models;

namespace HospitalityTaskManager.Api.DTOs;

public sealed class TaskDto
{
    public required int Id { get; init; }

    public required string Title { get; init; }

    public string? Description { get; init; }

    public required string Department { get; init; }

    public required TaskItemStatus Status { get; init; }

    public required TaskPriority Priority { get; init; }

    public DateTime? DueDate { get; init; }

    public required DateTime CreatedAt { get; init; }

    public DateTime? UpdatedAt { get; init; }
}
