using System.ComponentModel.DataAnnotations;
using HospitalityTaskManager.Api.Models;

namespace HospitalityTaskManager.Api.DTOs;

public sealed class UpdateTaskDto : IValidatableObject
{
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string Department { get; set; } = string.Empty;

    [Required]
    public TaskItemStatus? Status { get; set; }

    [Required]
    public TaskPriority? Priority { get; set; }

    public DateTime? DueDate { get; set; }

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
