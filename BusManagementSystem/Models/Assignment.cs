using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BusManagementSystem.Models
{
    /// <summary>
    /// 分車安排：此人在這次行程被安排到哪台車
    /// </summary>
    public class Assignment
    {
        public int Id { get; set; }

        [Required]
        public int TripId { get; set; }

        [Required]
        public int PersonId { get; set; }

        [Required]
        public int BusId { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string? Notes { get; set; }

        // Navigation properties
        [ForeignKey(nameof(TripId))]
        public virtual Trip Trip { get; set; } = null!;

        [ForeignKey(nameof(PersonId))]
        public virtual Person Person { get; set; } = null!;

        [ForeignKey(nameof(BusId))]
        public virtual Bus Bus { get; set; } = null!;
    }
}