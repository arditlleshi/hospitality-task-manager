using System.Text.Json.Serialization;

namespace HospitalityTaskManager.Api.Models;

[JsonConverter(typeof(JsonStringEnumConverter<TaskPriority>))]
public enum TaskPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Urgent = 4,
}
