using System.Diagnostics.CodeAnalysis;

namespace HospitalityTaskManager.Api.Models;

/// <summary>
/// Defines the supported task field values used by the application.
/// </summary>
public static class TaskCatalog
{
    private static readonly Dictionary<string, string> DepartmentLookup =
        CreateLookup(["Reception", "Housekeeping", "Kitchen", "Maintenance", "Management"]);

    /// <summary>
    /// Gets the supported departments.
    /// </summary>
    public static IReadOnlyCollection<string> Departments => DepartmentLookup.Values;

    /// <summary>
    /// Gets the supported task statuses.
    /// </summary>
    public static IReadOnlyCollection<string> Statuses => Enum.GetNames<TaskItemStatus>();

    /// <summary>
    /// Gets the supported task priorities.
    /// </summary>
    public static IReadOnlyCollection<string> Priorities => Enum.GetNames<TaskPriority>();

    /// <summary>
    /// Attempts to normalize a department value to the application's canonical form.
    /// </summary>
    /// <param name="value">The input department value.</param>
    /// <param name="normalizedValue">The normalized department value when successful.</param>
    /// <returns><c>true</c> when the input is supported; otherwise <c>false</c>.</returns>
    public static bool TryNormalizeDepartment(string? value, [NotNullWhen(true)] out string? normalizedValue) =>
        TryNormalize(DepartmentLookup, value, out normalizedValue);

    /// <summary>
    /// Attempts to parse a task status value.
    /// </summary>
    /// <param name="value">The input status value.</param>
    /// <param name="status">The parsed status value when successful.</param>
    /// <returns><c>true</c> when the input is supported; otherwise <c>false</c>.</returns>
    public static bool TryParseStatus(string? value, out TaskItemStatus status) =>
        Enum.TryParse(value?.Trim(), ignoreCase: true, out status) &&
        Enum.IsDefined(status);

    /// <summary>
    /// Attempts to parse a task priority value.
    /// </summary>
    /// <param name="value">The input priority value.</param>
    /// <param name="priority">The parsed priority value when successful.</param>
    /// <returns><c>true</c> when the input is supported; otherwise <c>false</c>.</returns>
    public static bool TryParsePriority(string? value, out TaskPriority priority) =>
        Enum.TryParse(value?.Trim(), ignoreCase: true, out priority) &&
        Enum.IsDefined(priority);

    /// <summary>
    /// Normalizes a department value or throws when it is not supported.
    /// </summary>
    /// <param name="value">The department value to normalize.</param>
    /// <returns>The canonical department value.</returns>
    public static string NormalizeDepartment(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        return DepartmentLookup.TryGetValue(value.Trim(), out var normalizedValue)
            ? normalizedValue
            : throw new ArgumentOutOfRangeException(nameof(value), $"Unsupported value '{value}'.");
    }

    /// <summary>
    /// Parses a task status value or throws when it is not supported.
    /// </summary>
    /// <param name="value">The task status value to normalize.</param>
    /// <returns>The parsed status value.</returns>
    public static TaskItemStatus ParseStatus(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        return TryParseStatus(value, out var status)
            ? status
            : throw new ArgumentOutOfRangeException(nameof(value), $"Unsupported value '{value}'.");
    }

    /// <summary>
    /// Parses a task priority value or throws when it is not supported.
    /// </summary>
    /// <param name="value">The task priority value to normalize.</param>
    /// <returns>The parsed priority value.</returns>
    public static TaskPriority ParsePriority(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        return TryParsePriority(value, out var priority)
            ? priority
            : throw new ArgumentOutOfRangeException(nameof(value), $"Unsupported value '{value}'.");
    }

    private static Dictionary<string, string> CreateLookup(IEnumerable<string> values) =>
        values.ToDictionary(value => value, value => value, StringComparer.OrdinalIgnoreCase);

    private static bool TryNormalize(
        IReadOnlyDictionary<string, string> lookup,
        string? value,
        [NotNullWhen(true)] out string? normalizedValue)
    {
        normalizedValue = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return lookup.TryGetValue(value.Trim(), out normalizedValue);
    }
}
