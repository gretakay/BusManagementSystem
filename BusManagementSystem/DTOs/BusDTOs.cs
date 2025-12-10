namespace BusManagementSystem.DTOs
{
    public class BusDTO
    {
        public int TripId { get; set; }
        public string PlateNumber { get; set; } = string.Empty; // 對應到Bus.Name
        public int Capacity { get; set; }
        public string? LeaderUserId { get; set; }
        public string? Description { get; set; }
    }
}
