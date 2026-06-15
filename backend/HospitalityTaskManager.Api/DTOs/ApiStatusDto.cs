namespace HospitalityTaskManager.Api.DTOs;

/// <summary>
/// Represents the API status information returned to clients.
/// </summary>
public sealed class ApiStatusDto
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
    /// Gets the UTC timestamp when the response was generated.
    /// </summary>
    public required DateTime ServerTimeUtc { get; init; }

    /// <summary>
    /// Gets the overall health status label.
    /// </summary>
    public required string Status { get; init; }
}
