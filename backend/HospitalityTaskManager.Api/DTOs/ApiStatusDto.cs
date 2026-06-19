namespace HospitalityTaskManager.Api.DTOs;

public sealed class ApiStatusDto
{
    public required string ApplicationName { get; init; }

    public required string EnvironmentName { get; init; }

    public required DateTime ServerTimeUtc { get; init; }

    public required string Status { get; init; }
}
