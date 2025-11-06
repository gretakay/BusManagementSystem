using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.Models
{
    /// <summary>
    /// 行程領隊關聯表，記錄哪位學員被指派為哪個行程的領隊
    /// </summary>
    public class TripLeader
    {
        public int Id { get; set; }

        [Required]
        public int TripId { get; set; }

        [Required]
        public int PersonId { get; set; } // 改為關聯到 Person 而不是 ApplicationUser

        [Required]
        [MaxLength(50)]
        public string LeaderStudentId { get; set; } = string.Empty; // 領隊學號

        [MaxLength(200)]
        public string? Description { get; set; } // 備註

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual Trip Trip { get; set; } = null!;
        public virtual Person Person { get; set; } = null!; // 改為關聯到 Person

        /// <summary>
        /// 檢查領隊是否可以在指定日期登入
        /// 規則：行程日期前3天到行程結束後1天
        /// </summary>
        public bool CanLoginOnDate(DateTime checkDate)
        {
            if (!IsActive) return false;

            var tripDate = Trip.Date.Date;
            var checkDateOnly = checkDate.Date;

            // 可登入範圍：行程前3天到行程後1天
            var loginStartDate = tripDate.AddDays(-3);
            var loginEndDate = tripDate.AddDays(1);

            return checkDateOnly >= loginStartDate && checkDateOnly <= loginEndDate;
        }
    }
}