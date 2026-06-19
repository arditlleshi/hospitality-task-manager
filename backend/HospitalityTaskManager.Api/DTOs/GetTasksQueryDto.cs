using System.ComponentModel.DataAnnotations;
using HospitalityTaskManager.Api.Models;

namespace HospitalityTaskManager.Api.DTOs;

public sealed class GetTasksQueryDto : IValidatableObject
{
    public TaskItemStatus? Status { get; set; }

    [MaxLength(50)]
    public string? Department { get; set; }

    [MaxLength(150)]
    public string? Search { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Status is not null && !Enum.IsDefined(Status.Value))
        {
            yield return new ValidationResult(
                $"Status must be one of: {string.Join(", ", TaskCatalog.Statuses)}.",
                [nameof(Status)]);
        }

        if (!string.IsNullOrWhiteSpace(Department) && !TaskCatalog.TryNormalizeDepartment(Department, out _))
        {
            yield return new ValidationResult(
                $"Department must be one of: {string.Join(", ", TaskCatalog.Departments)}.",
                [nameof(Department)]);
        }
    }
}
