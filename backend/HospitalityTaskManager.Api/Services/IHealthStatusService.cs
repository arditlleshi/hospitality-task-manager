using HospitalityTaskManager.Api.Models;

namespace HospitalityTaskManager.Api.Services;

public interface IHealthStatusService
{
    Task<ApiStatus> GetCurrentStatusAsync(CancellationToken cancellationToken);
}
