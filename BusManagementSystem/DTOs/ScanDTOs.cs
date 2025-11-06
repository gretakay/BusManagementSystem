using BusManagementSystem.Models;
using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.DTOs
{
    public class ScanRequest
    {
        [Required]
        public int TripId { get; set; }

        [Required]
        public int BusId { get; set; }

        [Required]
        public string CardNoOrToken { get; set; } = string.Empty;

        public BoardingAction? Action { get; set; } // 如果為 null，則自動判斷

        public string? DeviceId { get; set; }

        public string? Notes { get; set; }
    }

    public class ScanResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public BoardingAction Action { get; set; }
        public PersonDto? Person { get; set; }
        public BusStatusDto? BusStatus { get; set; }
    }

    public class PersonDto
    {
        public int Id { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? DharmaName { get; set; }
        public string Monastery { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsOnBoard { get; set; }
        
        // 為了向後相容
        public string CardNo => StudentId;
    }

    public class BusStatusDto
    {
        public int BusId { get; set; }
        public string BusName { get; set; } = string.Empty;
        public int CurrentCount { get; set; }
        public int Capacity { get; set; }
        public List<PersonDto> OnBoardPersons { get; set; } = new();
    }
}