using HospitalityTaskManager.Api.DTOs;
using HospitalityTaskManager.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HospitalityTaskManager.Api.Controllers;

/// <summary>
/// Exposes CRUD operations for hospitality tasks.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class TasksController(ITaskService taskService) : ControllerBase
{
    private readonly ITaskService _taskService =
        taskService ?? throw new ArgumentNullException(nameof(taskService));

    /// <summary>
    /// Gets tasks that match the provided filters.
    /// </summary>
    /// <param name="query">The optional task filters.</param>
    /// <param name="cancellationToken">Cancels the request if the client disconnects.</param>
    /// <returns>The matching tasks.</returns>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<TaskDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TaskDto>>> GetTasksAsync(
        [FromQuery] GetTasksQueryDto query,
        CancellationToken cancellationToken)
    {
        var tasks = await _taskService.GetTasksAsync(query, cancellationToken).ConfigureAwait(false);
        return Ok(tasks);
    }

    /// <summary>
    /// Gets the summary counts for tasks that match the provided filters.
    /// </summary>
    /// <param name="query">The optional task filters.</param>
    /// <param name="cancellationToken">Cancels the request if the client disconnects.</param>
    /// <returns>The task summary counts.</returns>
    [HttpGet("summary")]
    [ProducesResponseType<TaskSummaryDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<TaskSummaryDto>> GetTaskSummaryAsync(
        [FromQuery] GetTasksQueryDto query,
        CancellationToken cancellationToken)
    {
        var summary = await _taskService.GetTaskSummaryAsync(query, cancellationToken).ConfigureAwait(false);
        return Ok(summary);
    }

    /// <summary>
    /// Gets a task by identifier.
    /// </summary>
    /// <param name="taskId">The task identifier.</param>
    /// <param name="cancellationToken">Cancels the request if the client disconnects.</param>
    /// <returns>The matching task.</returns>
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

    /// <summary>
    /// Creates a new task.
    /// </summary>
    /// <param name="request">The task creation payload.</param>
    /// <param name="cancellationToken">Cancels the request if the client disconnects.</param>
    /// <returns>The created task.</returns>
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

    /// <summary>
    /// Updates an existing task.
    /// </summary>
    /// <param name="taskId">The task identifier.</param>
    /// <param name="request">The task update payload.</param>
    /// <param name="cancellationToken">Cancels the request if the client disconnects.</param>
    /// <returns>The updated task.</returns>
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

    /// <summary>
    /// Deletes an existing task.
    /// </summary>
    /// <param name="taskId">The task identifier.</param>
    /// <param name="cancellationToken">Cancels the request if the client disconnects.</param>
    /// <returns>No content when the task is deleted.</returns>
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
