namespace HospitalityTaskManager.Api.Models;

public sealed class ApiStatus
{
    public string ApplicationName { get; init; } = string.Empty;

    public string EnvironmentName { get; init; } = string.Empty;

    public DateTime ServerTimeUtc { get; init; }

    public string Status { get; init; } = string.Empty;
}
