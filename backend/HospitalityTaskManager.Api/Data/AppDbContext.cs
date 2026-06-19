using HospitalityTaskManager.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HospitalityTaskManager.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        var taskEntity = modelBuilder.Entity<TaskItem>();

        taskEntity.ToTable("Tasks");
        taskEntity.HasKey(task => task.Id);
        taskEntity.Property(task => task.Title).IsRequired().HasMaxLength(150);
        taskEntity.Property(task => task.Description).HasMaxLength(2000);
        taskEntity.Property(task => task.Department).IsRequired().HasMaxLength(50);
        taskEntity.Property(task => task.Status).HasConversion<string>().IsRequired().HasMaxLength(50);
        taskEntity.Property(task => task.Priority).HasConversion<string>().IsRequired().HasMaxLength(50);
        taskEntity.Property(task => task.CreatedAt).IsRequired();

        taskEntity.HasIndex(task => task.Status);
        taskEntity.HasIndex(task => task.Department);
        taskEntity.HasIndex(task => task.DueDate);
    }
}
