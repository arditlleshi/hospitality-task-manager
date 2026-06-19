using HospitalityTaskManager.Api.Models;

namespace HospitalityTaskManager.Api.Services;

public sealed class HealthStatusService(
    ILogger<HealthStatusService> logger,
    IWebHostEnvironment environment) : IHealthStatusService
{
    private readonly ILogger<HealthStatusService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IWebHostEnvironment _environment =
        environment ?? throw new ArgumentNullException(nameof(environment));

    public Task<ApiStatus> GetCurrentStatusAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _logger.LogInformation(
            "Returning API status for environment {EnvironmentName}.",
            _environment.EnvironmentName);

        var status = new ApiStatus
        {
            ApplicationName = "Hospitality Task Manager API",
            EnvironmentName = _environment.EnvironmentName,
            ServerTimeUtc = DateTime.UtcNow,
            Status = "Healthy",
        };

        return Task.FromResult(status);
    }
}
