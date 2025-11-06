using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        [MaxLength(100)]
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// 學號，用於領隊免密碼登入
        /// </summary>
        [MaxLength(50)]
        public string? StudentId { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginAt { get; set; }

        // Navigation properties
        public virtual ICollection<Bus> LeaderBuses { get; set; } = new List<Bus>();
    }
}