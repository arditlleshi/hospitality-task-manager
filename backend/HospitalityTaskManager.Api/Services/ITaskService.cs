using HospitalityTaskManager.Api.DTOs;

namespace HospitalityTaskManager.Api.Services;

public interface ITaskService
{
    Task<IReadOnlyList<TaskDto>> GetTasksAsync(GetTasksQueryDto query, CancellationToken cancellationToken);

    Task<TaskSummaryDto> GetTaskSummaryAsync(GetTasksQueryDto query, CancellationToken cancellationToken);

    Task<TaskDto?> GetTaskByIdAsync(int taskId, CancellationToken cancellationToken);

    Task<TaskDto> CreateTaskAsync(CreateTaskDto request, CancellationToken cancellationToken);

    Task<TaskDto?> UpdateTaskAsync(int taskId, UpdateTaskDto request, CancellationToken cancellationToken);

    Task<bool> DeleteTaskAsync(int taskId, CancellationToken cancellationToken);
}
