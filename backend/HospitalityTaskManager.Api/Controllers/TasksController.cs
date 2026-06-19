using HospitalityTaskManager.Api.DTOs;
using HospitalityTaskManager.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HospitalityTaskManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class TasksController(ITaskService taskService) : ControllerBase
{
    private readonly ITaskService _taskService =
        taskService ?? throw new ArgumentNullException(nameof(taskService));

    [HttpGet]
    [ProducesResponseType<IReadOnlyList<TaskDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TaskDto>>> GetTasksAsync(
        [FromQuery] GetTasksQueryDto query,
        CancellationToken cancellationToken)
    {
        var tasks = await _taskService.GetTasksAsync(query, cancellationToken).ConfigureAwait(false);
        return Ok(tasks);
    }

    [HttpGet("summary")]
    [ProducesResponseType<TaskSummaryDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<TaskSummaryDto>> GetTaskSummaryAsync(
        [FromQuery] GetTasksQueryDto query,
        CancellationToken cancellationToken)
    {
        var summary = await _taskService.GetTaskSummaryAsync(query, cancellationToken).ConfigureAwait(false);
        return Ok(summary);
    }

    [HttpGet("{taskId:int}", Name = "GetTaskById")]
    [ProducesResponseType<TaskDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskDto>> GetTaskByIdAsync(int taskId, CancellationToken cancellationToken)
    {
        if (taskId <= 0)
        {
            return BadRequest("Task id must be greater than zero.");
        }

        var task = await _taskService.GetTaskByIdAsync(taskId, cancellationToken).ConfigureAwait(false);

        return task is null ? NotFound() : Ok(task);
    }

    [HttpPost]
    [ProducesResponseType<TaskDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TaskDto>> CreateTaskAsync(
        [FromBody] CreateTaskDto request,
        CancellationToken cancellationToken)
    {
        var task = await _taskService.CreateTaskAsync(request, cancellationToken).ConfigureAwait(false);

        return CreatedAtRoute("GetTaskById", new { taskId = task.Id }, task);
    }

    [HttpPut("{taskId:int}")]
    [ProducesResponseType<TaskDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskDto>> UpdateTaskAsync(
        int taskId,
        [FromBody] UpdateTaskDto request,
        CancellationToken cancellationToken)
    {
        if (taskId <= 0)
        {
            return BadRequest("Task id must be greater than zero.");
        }

        var task = await _taskService.UpdateTaskAsync(taskId, request, cancellationToken).ConfigureAwait(false);

        return task is null ? NotFound() : Ok(task);
    }

    [HttpDelete("{taskId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTaskAsync(int taskId, CancellationToken cancellationToken)
    {
        if (taskId <= 0)
        {
            return BadRequest("Task id must be greater than zero.");
        }

        var deleted = await _taskService.DeleteTaskAsync(taskId, cancellationToken).ConfigureAwait(false);

        return deleted ? NoContent() : NotFound();
    }
}
