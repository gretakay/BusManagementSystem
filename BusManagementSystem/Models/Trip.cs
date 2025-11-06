using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.Models
{
    public enum TripDirection
    {
        Outbound = 1, // 去程
        Inbound = 2   // 回程
    }

    public enum TripStatus
    {
        Draft = 1,    // 草稿
        Open = 2,     // 開放
        Closed = 3    // 關閉
    }

    public class Trip
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public TripDirection Direction { get; set; }

        [Required]
        public TripStatus Status { get; set; } = TripStatus.Draft;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Bus> Buses { get; set; } = new List<Bus>();
        public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public virtual ICollection<Boarding> Boardings { get; set; } = new List<Boarding>();
    }
}