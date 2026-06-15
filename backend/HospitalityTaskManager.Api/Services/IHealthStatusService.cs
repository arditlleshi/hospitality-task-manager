using HospitalityTaskManager.Api.Models;

namespace HospitalityTaskManager.Api.Services;

/// <summary>
/// Provides operational status details for the API.
/// </summary>
public interface IHealthStatusService
{
    /// <summary>
    /// Gets the current API status snapshot.
    /// </summary>
    /// <param name="cancellationToken">Cancels the operation when the request is aborted.</param>
    /// <returns>The current API status snapshot.</returns>
    Task<ApiStatus> GetCurrentStatusAsync(CancellationToken cancellationToken);
}
