namespace HospitalityTaskManager.Api.Models;

/// <summary>
/// Represents the internal health state of the API.
/// </summary>
public sealed class ApiStatus
{
    /// <summary>
    /// Gets the application name.
    /// </summary>
    public required string ApplicationName { get; init; }

    /// <summary>
    /// Gets the current hosting environment name.
    /// </summary>
    public required string EnvironmentName { get; init; }

    /// <summary>
    /// Gets the UTC timestamp when the status snapshot was created.
    /// </summary>
    public required DateTime ServerTimeUtc { get; init; }

    /// <summary>
    /// Gets the overall health status label.
    /// </summary>
    public required string Status { get; init; }
}
