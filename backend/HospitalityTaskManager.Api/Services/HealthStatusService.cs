using HospitalityTaskManager.Api.Models;

namespace HospitalityTaskManager.Api.Services;

/// <summary>
/// Builds operational status data for the API.
/// </summary>
public sealed class HealthStatusService(
    ILogger<HealthStatusService> logger,
    IWebHostEnvironment environment) : IHealthStatusService
{
    private readonly ILogger<HealthStatusService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IWebHostEnvironment _environment =
        environment ?? throw new ArgumentNullException(nameof(environment));

    /// <summary>
    /// Gets the current API status snapshot.
    /// </summary>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns>The current API status snapshot.</returns>
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
