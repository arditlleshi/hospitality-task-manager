using System.Text.Json.Serialization;

namespace HospitalityTaskManager.Api.Models;

[JsonConverter(typeof(JsonStringEnumConverter<TaskItemStatus>))]
public enum TaskItemStatus
{
    Open = 1,
    InProgress = 2,
    Done = 3,
    Cancelled = 4,
}
