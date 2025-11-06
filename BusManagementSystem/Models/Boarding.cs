using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BusManagementSystem.Models
{
    public enum BoardingAction
    {
        Board = 1,      // 上車
        Unboard = 2     // 下車
    }

    public enum BoardingSource
    {
        Online = 1,         // 線上即時
        OfflineSync = 2     // 離線同步
    }

    /// <summary>
    /// 上下車記錄：每次刷卡的歷史記錄
    /// </summary>
    public class Boarding
    {
        public int Id { get; set; }

        [Required]
        public int TripId { get; set; }

        [Required]
        public int BusId { get; set; }

        [Required]
        public int PersonId { get; set; }

        [Required]
        public BoardingAction Action { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(100)]
        public string? DeviceId { get; set; } // 哪支手機/設備

        [Required]
        public BoardingSource Source { get; set; } = BoardingSource.Online;

        [Required]
        [MaxLength(100)]
        public string UniqueHash { get; set; } = string.Empty; // 避免重複上傳

        [MaxLength(500)]
        public string? Notes { get; set; }

        // Navigation properties
        [ForeignKey(nameof(TripId))]
        public virtual Trip Trip { get; set; } = null!;

        [ForeignKey(nameof(BusId))]
        public virtual Bus Bus { get; set; } = null!;

        [ForeignKey(nameof(PersonId))]
        public virtual Person Person { get; set; } = null!;
    }
}