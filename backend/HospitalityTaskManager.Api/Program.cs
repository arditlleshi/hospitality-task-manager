using HospitalityTaskManager.Api.Data;
using HospitalityTaskManager.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        BuildSqliteConnectionString(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            builder.Environment.ContentRootPath)));
builder.Services.AddScoped<IHealthStatusService, HealthStatusService>();
builder.Services.AddScoped<ITaskService, TaskService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Hospitality Task Manager API v1");
    });
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

static string BuildSqliteConnectionString(string? baseConnectionString, string contentRootPath)
{
    if (string.IsNullOrWhiteSpace(baseConnectionString))
    {
        throw new InvalidOperationException("The 'DefaultConnection' connection string is not configured.");
    }

    var connectionStringBuilder = new SqliteConnectionStringBuilder(baseConnectionString);

    if (!string.IsNullOrWhiteSpace(connectionStringBuilder.DataSource) &&
        !string.Equals(connectionStringBuilder.DataSource, ":memory:", StringComparison.Ordinal) &&
        !Path.IsPathRooted(connectionStringBuilder.DataSource))
    {
        var databasePath = Path.GetFullPath(Path.Combine(contentRootPath, connectionStringBuilder.DataSource));
        var databaseDirectory = Path.GetDirectoryName(databasePath);

        if (!string.IsNullOrWhiteSpace(databaseDirectory))
        {
            Directory.CreateDirectory(databaseDirectory);
        }

        connectionStringBuilder.DataSource = databasePath;
    }

    return connectionStringBuilder.ToString();
}
