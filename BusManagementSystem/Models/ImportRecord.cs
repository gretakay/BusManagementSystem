using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.Models
{
    public class ImportRecord
    {
        [Key]
        public int Id { get; set; }

        public string ImporterUserId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // JSON payload summary or path
        public string Summary { get; set; } = string.Empty;

        // Store created assignment ids for rollback
        public string CreatedAssignmentIdsJson { get; set; } = string.Empty;

        public bool IsRolledBack { get; set; } = false;

        public DateTime? RolledBackAt { get; set; }
    }
}
