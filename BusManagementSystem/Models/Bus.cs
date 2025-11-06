using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BusManagementSystem.Models
{
    public class Bus
    {
        public int Id { get; set; }

        [Required]
        public int TripId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // A車、B車等

        [Required]
        [Range(1, 100)]
        public int Capacity { get; set; } // 座位數

        [Required]
        public string LeaderUserId { get; set; } = string.Empty; // 領隊ID

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey(nameof(TripId))]
        public virtual Trip Trip { get; set; } = null!;

        [ForeignKey(nameof(LeaderUserId))]
        public virtual ApplicationUser LeaderUser { get; set; } = null!;

        public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public virtual ICollection<Boarding> Boardings { get; set; } = new List<Boarding>();
    }
}