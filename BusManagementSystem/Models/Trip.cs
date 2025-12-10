using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BusManagementSystem.Models
{
    // 新增：支援多段/多日行程方向
    public enum TripDirection
    {
        Outbound = 1, // 去程
        Inbound = 2,  // 回程
        // 可擴充：環狀、多段等
    }

    // 新增：補充狀態 Cancelled/Completed
    public enum TripStatus
    {
        Draft = 1,    // 草稿
        Open = 2,     // 開放
        Closed = 3,   // 關閉
        Cancelled = 4,// 已取消
        Completed = 5 // 已完成
    }

    public class Trip
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        // 新增：唯一性驗證（EF 層面可加 Unique Index）
        public string Name { get; set; } = string.Empty;

        // 新增：支援多日行程
        [Required]
        public DateTime StartDate { get; set; } // 行程開始日期（UTC）

        [Required]
        public DateTime EndDate { get; set; }   // 行程結束日期（UTC）

        // 保留原本 Date 欄位，方便舊資料遷移
        [NotMapped]
        public DateTime Date
        {
            get => StartDate;
            set => StartDate = value;
        }

        [Required]
        public TripDirection Direction { get; set; }

        [Required]
        public TripStatus Status { get; set; } = TripStatus.Draft;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // 新增：樂觀鎖，防止 race condition
        [Timestamp]
        public byte[] RowVersion { get; set; }

        // Navigation properties
        public virtual ICollection<Bus> Buses { get; set; } = new List<Bus>();
        public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public virtual ICollection<Boarding> Boardings { get; set; } = new List<Boarding>();

        // 新增：資料完整性驗證 Helper
        // 解決：狀態流轉時資料不一致風險
        public bool IsReadyToOpen()
        {
            // 行程必須有車輛、領隊、站點等（可擴充）
            return Buses != null && Buses.Count > 0;
        }
    }
}