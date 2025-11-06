using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.Models
{
    /// <summary>
    /// 系統設定：存放各種設定值
    /// </summary>
    public class Setting
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Key { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Value { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}