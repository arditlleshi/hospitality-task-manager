using System.ComponentModel.DataAnnotations;
using HospitalityTaskManager.Api.Models;

namespace HospitalityTaskManager.Api.DTOs;

/// <summary>
/// Represents optional filters for task list requests.
/// </summary>
public sealed class GetTasksQueryDto : IValidatableObject
{
    /// <summary>
    /// Gets or sets the optional status filter.
    /// </summary>
    public TaskItemStatus? Status { get; set; }

    /// <summary>
    /// Gets or sets the optional department filter.
    /// </summary>
    [MaxLength(50)]
    public string? Department { get; set; }

    /// <summary>
    /// Gets or sets the optional title or description search term.
    /// </summary>
    [MaxLength(150)]
    public string? Search { get; set; }

    /// <summary>
    /// Validates the query string values.
    /// </summary>
    /// <param name="validationContext">Provides context for validation.</param>
    /// <returns>The validation errors, if any.</returns>
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
