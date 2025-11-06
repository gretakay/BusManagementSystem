using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.Models
{
    public enum PersonRole
    {
        LongTermVolunteer = 1,    // 長期義工
        BuddhistPatrol = 2,       // 佛巡
        Museum = 3,               // 博物館
        Monk = 4,                 // 法師
        MonasteryVolunteer = 5    // 精舍義工
    }

    public class Person
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string StudentId { get; set; } = string.Empty; // 學號(英數字混合)

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // 姓名

        [MaxLength(100)]
        public string? DharmaName { get; set; } // 法名

        [Required]
        [MaxLength(100)]
        public string Monastery { get; set; } = string.Empty; // 精舍別(例如普、普門)

        [Required]
        public PersonRole Role { get; set; } = PersonRole.LongTermVolunteer; // 身分別

        [MaxLength(20)]
        public string? PhoneNumber { get; set; } // 行動電話(選填)

        [MaxLength(100)]
        public string? GroupName { get; set; } // 組別名稱(選填)

        [MaxLength(500)]
        public string? Remark { get; set; } // 備註

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public virtual ICollection<Boarding> Boardings { get; set; } = new List<Boarding>();

        // 為了向後相容，保留原本的 CardNo 屬性
        [MaxLength(50)]
        public string CardNo 
        { 
            get => StudentId; 
            set => StudentId = value; 
        }
    }
}