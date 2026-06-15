using System.Text.Json.Serialization;

namespace HospitalityTaskManager.Api.Models;

 [JsonConverter(typeof(JsonStringEnumConverter<TaskItemStatus>))]
/// <summary>
/// Defines the supported workflow states for a task.
/// </summary>
public enum TaskItemStatus
{
    /// <summary>
    /// The task has been created and is waiting to be started.
    /// </summary>
    Open = 1,

    /// <summary>
    /// The task is currently being worked on.
    /// </summary>
    InProgress = 2,

    /// <summary>
    /// The task has been completed.
    /// </summary>
    Done = 3,

    /// <summary>
    /// The task has been cancelled and will not be completed.
    /// </summary>
    Cancelled = 4,
}
