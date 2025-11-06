using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.DTOs
{
    public class TripLeaderResponse
    {
        public int Id { get; set; }
        public int TripId { get; set; }
        public string TripName { get; set; } = string.Empty;
        public DateTime TripDate { get; set; }
        public int LeaderPersonId { get; set; } // 改為 PersonId
        public string LeaderDisplayName { get; set; } = string.Empty;
        public string LeaderStudentId { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CanLoginFrom { get; set; }
        public DateTime CanLoginTo { get; set; }
    }

    public class AssignTripLeaderRequest
    {
        [Required]
        public int TripId { get; set; }

        [Required]
        [MaxLength(50)]
        public string LeaderStudentId { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Description { get; set; }
    }
}