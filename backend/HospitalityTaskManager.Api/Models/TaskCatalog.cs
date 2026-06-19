using System.Diagnostics.CodeAnalysis;

namespace HospitalityTaskManager.Api.Models;

public static class TaskCatalog
{
    private static readonly Dictionary<string, string> DepartmentLookup =
        CreateLookup(["Reception", "Housekeeping", "Kitchen", "Maintenance", "Management"]);

    public static IReadOnlyCollection<string> Departments => DepartmentLookup.Values;

    public static IReadOnlyCollection<string> Statuses => Enum.GetNames<TaskItemStatus>();

    public static IReadOnlyCollection<string> Priorities => Enum.GetNames<TaskPriority>();

    public static bool TryNormalizeDepartment(string? value, [NotNullWhen(true)] out string? normalizedValue) =>
        TryNormalize(DepartmentLookup, value, out normalizedValue);

    public static bool TryParseStatus(string? value, out TaskItemStatus status) =>
        Enum.TryParse(value?.Trim(), ignoreCase: true, out status) &&
        Enum.IsDefined(status);

    public static bool TryParsePriority(string? value, out TaskPriority priority) =>
        Enum.TryParse(value?.Trim(), ignoreCase: true, out priority) &&
        Enum.IsDefined(priority);

    public static string NormalizeDepartment(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        return DepartmentLookup.TryGetValue(value.Trim(), out var normalizedValue)
            ? normalizedValue
            : throw new ArgumentOutOfRangeException(nameof(value), $"Unsupported value '{value}'.");
    }

    public static TaskItemStatus ParseStatus(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        return TryParseStatus(value, out var status)
            ? status
            : throw new ArgumentOutOfRangeException(nameof(value), $"Unsupported value '{value}'.");
    }

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
