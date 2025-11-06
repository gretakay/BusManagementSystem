using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BusManagementSystem.Models;

namespace BusManagementSystem.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // DbSets
        public DbSet<Person> People { get; set; }
        public DbSet<Trip> Trips { get; set; }
        public DbSet<Bus> Buses { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Boarding> Boardings { get; set; }
        public DbSet<Setting> Settings { get; set; }
        public DbSet<TripLeader> TripLeaders { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Person
            builder.Entity<Person>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.StudentId).IsUnique();
                entity.Property(e => e.StudentId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.DharmaName).HasMaxLength(100);
                entity.Property(e => e.Monastery).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Role).HasConversion<int>();
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.GroupName).HasMaxLength(100);
                entity.Property(e => e.Remark).HasMaxLength(500);
                
                // 忽略 CardNo 屬性，因為它只是 StudentId 的別名
                entity.Ignore(e => e.CardNo);
            });

            // Configure TripLeader
            builder.Entity<TripLeader>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.LeaderStudentId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(200);

                // 複合索引：確保同一個學員在同一次行程只能有一個領隊記錄
                entity.HasIndex(e => new { e.TripId, e.PersonId }).IsUnique();

                entity.HasOne(e => e.Trip)
                      .WithMany()
                      .HasForeignKey(e => e.TripId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Person)
                      .WithMany()
                      .HasForeignKey(e => e.PersonId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Trip
            builder.Entity<Trip>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Direction).HasConversion<int>();
                entity.Property(e => e.Status).HasConversion<int>();
                entity.Property(e => e.Description).HasMaxLength(1000);
            });

            // Configure Bus
            builder.Entity<Bus>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                
                entity.HasOne(e => e.Trip)
                      .WithMany(t => t.Buses)
                      .HasForeignKey(e => e.TripId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.LeaderUser)
                      .WithMany(u => u.LeaderBuses)
                      .HasForeignKey(e => e.LeaderUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Assignment
            builder.Entity<Assignment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Notes).HasMaxLength(500);

                // 複合索引：確保同一個人在同一次行程只能有一個分車安排
                entity.HasIndex(e => new { e.TripId, e.PersonId }).IsUnique();

                entity.HasOne(e => e.Trip)
                      .WithMany(t => t.Assignments)
                      .HasForeignKey(e => e.TripId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Person)
                      .WithMany(p => p.Assignments)
                      .HasForeignKey(e => e.PersonId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Bus)
                      .WithMany(b => b.Assignments)
                      .HasForeignKey(e => e.BusId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Boarding
            builder.Entity<Boarding>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action).HasConversion<int>();
                entity.Property(e => e.Source).HasConversion<int>();
                entity.Property(e => e.DeviceId).HasMaxLength(100);
                entity.Property(e => e.UniqueHash).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Notes).HasMaxLength(500);

                // 確保 UniqueHash 是唯一的，避免重複上傳
                entity.HasIndex(e => e.UniqueHash).IsUnique();

                entity.HasOne(e => e.Trip)
                      .WithMany(t => t.Boardings)
                      .HasForeignKey(e => e.TripId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Bus)
                      .WithMany(b => b.Boardings)
                      .HasForeignKey(e => e.BusId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Person)
                      .WithMany(p => p.Boardings)
                      .HasForeignKey(e => e.PersonId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Setting
            builder.Entity<Setting>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Key).IsUnique();
                entity.Property(e => e.Key).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Value).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.Description).HasMaxLength(500);
            });

            // Configure Identity tables
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
            });
        }
    }
}