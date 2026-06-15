using HospitalityTaskManager.Api.DTOs;
using HospitalityTaskManager.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HospitalityTaskManager.Api.Controllers;

/// <summary>
/// Exposes operational health information for the API.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class HealthController(IHealthStatusService healthStatusService) : ControllerBase
{
    private readonly IHealthStatusService _healthStatusService =
        healthStatusService ?? throw new ArgumentNullException(nameof(healthStatusService));

    /// <summary>
    /// Returns the current operational status of the API.
    /// </summary>
    /// <param name="cancellationToken">Cancels the request if the client disconnects.</param>
    /// <returns>The current API status payload.</returns>
    [HttpGet]
    [ProducesResponseType<ApiStatusDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiStatusDto>> GetAsync(CancellationToken cancellationToken)
    {
        var status = await _healthStatusService.GetCurrentStatusAsync(cancellationToken).ConfigureAwait(false);

        var response = new ApiStatusDto
        {
            ApplicationName = status.ApplicationName,
            EnvironmentName = status.EnvironmentName,
            ServerTimeUtc = status.ServerTimeUtc,
            Status = status.Status,
        };

        return Ok(response);
    }
}
