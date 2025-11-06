using BusManagementSystem.Models;
using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.DTOs
{
    public class PersonListDto
    {
        public int Id { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? DharmaName { get; set; }
        public string Monastery { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePersonRequest
    {
        [Required]
        [MaxLength(50)]
        public string StudentId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? DharmaName { get; set; }

        [Required]
        [MaxLength(100)]
        public string Monastery { get; set; } = string.Empty;

        [Required]
        public PersonRole Role { get; set; }

        [MaxLength(500)]
        public string? Remark { get; set; }
    }

    public class UpdatePersonRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? DharmaName { get; set; }

        [Required]
        [MaxLength(100)]
        public string Monastery { get; set; } = string.Empty;

        [Required]
        public PersonRole Role { get; set; }

        [MaxLength(500)]
        public string? Remark { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class PersonDetailDto
    {
        public int Id { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? DharmaName { get; set; }
        public string Monastery { get; set; } = string.Empty;
        public PersonRole Role { get; set; }
        public string RoleDisplayName { get; set; } = string.Empty;
        public string? Remark { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class PersonRoleInfo
    {
        public PersonRole Value { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}