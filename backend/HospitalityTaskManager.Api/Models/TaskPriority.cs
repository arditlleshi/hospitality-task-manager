using System.Text.Json.Serialization;

namespace HospitalityTaskManager.Api.Models;

 [JsonConverter(typeof(JsonStringEnumConverter<TaskPriority>))]
/// <summary>
/// Defines the supported urgency levels for a task.
/// </summary>
public enum TaskPriority
{
    /// <summary>
    /// The task can be handled with low urgency.
    /// </summary>
    Low = 1,

    /// <summary>
    /// The task has standard urgency.
    /// </summary>
    Medium = 2,

    /// <summary>
    /// The task needs prompt attention.
    /// </summary>
    High = 3,

    /// <summary>
    /// The task is critical and should be addressed immediately.
    /// </summary>
    Urgent = 4,
}
