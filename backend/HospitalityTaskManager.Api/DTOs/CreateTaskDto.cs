using System.ComponentModel.DataAnnotations;
using HospitalityTaskManager.Api.Models;

namespace HospitalityTaskManager.Api.DTOs;

/// <summary>
/// Represents the task data required to create a new task.
/// </summary>
public sealed class CreateTaskDto : IValidatableObject
{
    /// <summary>
    /// Gets or sets the task title.
    /// </summary>
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the optional task description.
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the target department.
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Department { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the task status.
    /// </summary>
    [Required]
    public TaskItemStatus? Status { get; set; } = TaskItemStatus.Open;

    /// <summary>
    /// Gets or sets the task priority.
    /// </summary>
    [Required]
    public TaskPriority? Priority { get; set; } = TaskPriority.Medium;

    /// <summary>
    /// Gets or sets the optional due date.
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// Validates the request payload.
    /// </summary>
    /// <param name="validationContext">Provides context for validation.</param>
    /// <returns>The validation errors, if any.</returns>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Title))
        {
            yield return new ValidationResult("Title is required.", [nameof(Title)]);
        }

        if (!TaskCatalog.TryNormalizeDepartment(Department, out _))
        {
            yield return new ValidationResult(
                $"Department must be one of: {string.Join(", ", TaskCatalog.Departments)}.",
                [nameof(Department)]);
        }

        if (Status is null || !Enum.IsDefined(Status.Value))
        {
            yield return new ValidationResult(
                $"Status must be one of: {string.Join(", ", TaskCatalog.Statuses)}.",
                [nameof(Status)]);
        }

        if (Priority is null || !Enum.IsDefined(Priority.Value))
        {
            yield return new ValidationResult(
                $"Priority must be one of: {string.Join(", ", TaskCatalog.Priorities)}.",
                [nameof(Priority)]);
        }
    }
}
