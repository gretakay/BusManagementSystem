using BusManagementSystem.Models;
using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.DTOs
{
    public class TripDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public TripDirection Direction { get; set; }
        public TripStatus Status { get; set; }
        public string? Description { get; set; }
        public List<BusDto> Buses { get; set; } = new();
        public int TotalCapacity { get; set; }
        public int TotalAssigned { get; set; }
        public int TotalOnBoard { get; set; }
    }

    public class CreateTripRequest
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public TripDirection Direction { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }
    }

    public class UpdateTripRequest
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public TripStatus Status { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }
    }

    public class BusDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public string LeaderUserId { get; set; } = string.Empty;
        public string LeaderName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int AssignedCount { get; set; }
        public int OnBoardCount { get; set; }
    }

    public class CreateBusRequest
    {
        [Required]
        public int TripId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Range(1, 100)]
        public int Capacity { get; set; }

        [Required]
        public string LeaderUserId { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }
    }
}