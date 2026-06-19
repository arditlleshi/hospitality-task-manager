namespace HospitalityTaskManager.Api.Models;

public sealed class TaskItem
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Department { get; set; } = string.Empty;

    public TaskItemStatus Status { get; set; } = TaskItemStatus.Open;

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public DateTime? DueDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
